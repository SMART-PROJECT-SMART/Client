import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  effect,
  input,
  viewChild,
  ElementRef,
} from '@angular/core';
import * as L from 'leaflet';
import { TelemetryField } from '../../../../common/enums';
import { ClientConstants } from '../../../../common/constants/clientConstants.constant';
import { AssignmentUtil } from '../../../../common/utils';
import type { MissionAssignmentPairing, UAV } from '../../../../models';
import { extractLatLonFromUav } from '../../utils/assignment-uav-geography.util';
import { createMissionDivIcon, createUavDivIcon } from '../../utils/assignment-review-map-marker.util';

const MAP = ClientConstants.AssignmentReviewMap;

type AssignmentReviewMapRenderContext = {
  pairings: MissionAssignmentPairing[];
  selectedMap: Map<string, number>;
  telemetry: Record<number, Record<TelemetryField, number>>;
  missionColors: Map<string, string>;
  tailColors: Map<number, string>;
};

@Component({
  selector: 'app-assignment-review-map',
  standalone: false,
  templateUrl: './assignment-review-map.component.html',
  styleUrl: './assignment-review-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentReviewMapComponent implements OnDestroy {
  readonly pairings = input.required<MissionAssignmentPairing[]>();
  readonly uavTelemetryData = input.required<Record<number, Record<TelemetryField, number>>>();
  readonly availableUavs = input.required<UAV[]>();
  readonly selectedTailIds = input.required<Map<string, number>>();

  readonly mapHost = viewChild<ElementRef<HTMLElement>>('mapHost');

  private map: L.Map | null = null;
  private layerGroup: L.LayerGroup | null = null;

  constructor() {
    effect(() => {
      this.pairings();
      this.selectedTailIds();
      this.availableUavs();
      this.uavTelemetryData();
      if (!this.map) {
        return;
      }
      queueMicrotask(() => this.syncLayers());
    });
  }

  onPanelOpened(): void {
    queueMicrotask(() => {
      this.ensureMap();
      this.syncLayers();
      this.map?.invalidateSize();
    });
  }

  private ensureMap(): void {
    if (this.map) {
      return;
    }
    const host = this.mapHost()?.nativeElement;
    if (!host) {
      return;
    }
    this.map = L.map(host).setView(
      [MAP.DEFAULT_CENTER_LAT, MAP.DEFAULT_CENTER_LON],
      MAP.DEFAULT_ZOOM,
    );
    L.tileLayer(MAP.OS_TILE_TEMPLATE, {
      attribution: MAP.TILE_ATTRIBUTION,
    }).addTo(this.map);
    this.layerGroup = L.layerGroup().addTo(this.map);
  }

  private syncLayers(): void {
    const map = this.map;
    const group = this.layerGroup;
    if (!map || !group) {
      return;
    }
    group.clearLayers();
    const boundsPoints: L.LatLngExpression[] = [];
    const context = this.buildRenderContext();
    this.renderUavMarkers(group, boundsPoints, context);
    this.renderMissionMarkersAndLinks(group, boundsPoints, context);
    this.fitMapToPoints(map, boundsPoints);
    queueMicrotask(() => map.invalidateSize());
  }

  private buildRenderContext(): AssignmentReviewMapRenderContext {
    const pairings = this.pairings();
    const selectedMap = this.selectedTailIds();
    const telemetry = this.uavTelemetryData();
    const missionColors = this.buildMissionColorMap(pairings);
    const tailColors = this.buildTailColorMap(pairings, selectedMap, missionColors);
    return {
      pairings,
      selectedMap,
      telemetry,
      missionColors,
      tailColors,
    };
  }

  private renderUavMarkers(
    group: L.LayerGroup,
    boundsPoints: L.LatLngExpression[],
    context: AssignmentReviewMapRenderContext,
  ): void {
    for (const uav of this.availableUavs()) {
      const pos = extractLatLonFromUav(uav);
      if (!pos) {
        continue;
      }
      const color = context.tailColors.get(uav.tailId) ?? MAP.UAV_COLOR_UNASSIGNED;
      const marker = L.marker([pos.lat, pos.lon], {
        icon: createUavDivIcon(color),
      });
      marker.bindTooltip(this.buildUavTooltip(uav.tailId));
      marker.addTo(group);
      boundsPoints.push([pos.lat, pos.lon]);
    }
  }

  private renderMissionMarkersAndLinks(
    group: L.LayerGroup,
    boundsPoints: L.LatLngExpression[],
    context: AssignmentReviewMapRenderContext,
  ): void {
    context.pairings.forEach((pairing) => {
      const loc = pairing.mission.location;
      boundsPoints.push([loc.latitude, loc.longitude]);
      const missionColor =
        context.missionColors.get(pairing.mission.id) ?? MAP.UAV_COLOR_UNASSIGNED;
      const missionMarker = L.marker([loc.latitude, loc.longitude], {
        icon: createMissionDivIcon(pairing.mission.requiredUAVType, missionColor),
      });
      missionMarker.bindTooltip(
        this.buildMissionTooltip(pairing.mission.title, pairing.mission.requiredUAVType),
      );
      missionMarker.addTo(group);

      const uavPos = this.resolveAssignedUavPosition(pairing, context);
      if (!uavPos) {
        return;
      }

      L.polyline(
        [
          [uavPos.lat, uavPos.lon],
          [loc.latitude, loc.longitude],
        ],
        {
          color: missionColor,
          weight: MAP.LINE_WEIGHT,
          opacity: MAP.LINE_OPACITY,
        },
      ).addTo(group);
    });
  }

  private resolveAssignedUavPosition(
    pairing: MissionAssignmentPairing,
    context: AssignmentReviewMapRenderContext,
  ): { lat: number; lon: number } | null {
    const tailId = context.selectedMap.get(pairing.mission.id) ?? pairing.tailId;
    const snap = context.telemetry[tailId];
    if (!snap) {
      return null;
    }
    const uav = AssignmentUtil.buildUavFromTelemetry(tailId, snap);
    return extractLatLonFromUav(uav);
  }

  private fitMapToPoints(map: L.Map, boundsPoints: L.LatLngExpression[]): void {
    if (boundsPoints.length > 0) {
      map.fitBounds(L.latLngBounds(boundsPoints), {
        padding: [MAP.FIT_PADDING_PX, MAP.FIT_PADDING_PX],
      });
      return;
    }
    map.setView([MAP.DEFAULT_CENTER_LAT, MAP.DEFAULT_CENTER_LON], MAP.DEFAULT_ZOOM);
  }

  private buildMissionColorMap(pairings: MissionAssignmentPairing[]): Map<string, string> {
    const map = new Map<string, string>();
    pairings.forEach((pairing, index) => {
      const hue = MAP.LINE_HUES[index % MAP.LINE_HUES.length];
      map.set(pairing.mission.id, this.buildLineColor(hue));
    });
    return map;
  }

  private buildLineColor(hue: number): string {
    return `hsl(${hue}, ${MAP.LINE_SATURATION_PERCENT}%, ${MAP.LINE_LIGHTNESS_PERCENT}%)`;
  }

  private buildUavTooltip(tailId: number): string {
    return `${MAP.TOOLTIP_UAV_PREFIX}${tailId}`;
  }

  private buildMissionTooltip(missionTitle: string, missionType: string): string {
    return `${missionTitle}${MAP.TOOLTIP_MISSION_SUFFIX_OPEN}${missionType}${MAP.TOOLTIP_MISSION_SUFFIX_CLOSE}`;
  }

  private buildTailColorMap(
    pairings: MissionAssignmentPairing[],
    selectedMap: Map<string, number>,
    missionColors: Map<string, string>,
  ): Map<number, string> {
    const map = new Map<number, string>();
    for (const pairing of pairings) {
      const tailId = selectedMap.get(pairing.mission.id) ?? pairing.tailId;
      if (!map.has(tailId)) {
        map.set(
          tailId,
          missionColors.get(pairing.mission.id) ?? MAP.UAV_COLOR_UNASSIGNED,
        );
      }
    }
    return map;
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
    this.layerGroup = null;
  }
}
