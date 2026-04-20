import {
  Component,
  ChangeDetectionStrategy,
  AfterViewInit,
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
import type { Mission, MissionAssignmentPairing, UAV } from '../../../../models';
import type { ActiveMissionRo } from '../../../../models/Ro/activeMissionRo.ro';
import { extractLatLonFromUav } from '../../utils/assignment-uav-geography.util';
import { createMissionDivIcon, createUavDivIcon } from '../../utils/assignment-review-map-marker.util';
import {
  buildMissionColorMap,
  buildTailColorMap,
  resolvePriorityOutlineColor,
} from '../../utils/assignment-review-map-color.util';
import {
  buildMissionTooltipContent,
  buildUavTooltipContent,
} from '../../utils/assignment-review-map-tooltip.util';

const MAP = ClientConstants.AssignmentReviewMap;

type AssignmentReviewMapRenderContext = {
  pairings: MissionAssignmentPairing[];
  selectedMap: Map<string, number>;
  telemetry: Record<number, Record<TelemetryField, number>>;
  missionColors: Map<string, string>;
  tailColors: Map<number, string>;
  activeMissionByTailId: Map<number, Mission>;
};

@Component({
  selector: 'app-assignment-review-map',
  standalone: false,
  templateUrl: './assignment-review-map.component.html',
  styleUrl: './assignment-review-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentReviewMapComponent implements AfterViewInit, OnDestroy {
  readonly pairings = input.required<MissionAssignmentPairing[]>();
  readonly uavTelemetryData = input.required<Record<number, Record<TelemetryField, number>>>();
  readonly availableUavs = input.required<UAV[]>();
  readonly selectedTailIds = input.required<Map<string, number>>();
  readonly activeMissions = input<ActiveMissionRo[]>([]);

  readonly mapHost = viewChild<ElementRef<HTMLElement>>('mapHost');

  private map: L.Map | null = null;
  private layerGroup: L.LayerGroup | null = null;

  constructor() {
    effect(() => {
      this.pairings();
      this.selectedTailIds();
      this.availableUavs();
      this.uavTelemetryData();
      this.activeMissions();
      if (!this.map) {
        return;
      }
      queueMicrotask(() => this.syncLayers());
    });
  }

  ngAfterViewInit(): void {
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
    const missionColors = buildMissionColorMap(pairings);
    const tailColors = buildTailColorMap(pairings, selectedMap, missionColors);
    const activeMissionByTailId = this.buildActiveMissionByTailIdMap();
    return {
      pairings,
      selectedMap,
      telemetry,
      missionColors,
      tailColors,
      activeMissionByTailId,
    };
  }

  private buildActiveMissionByTailIdMap(): Map<number, Mission> {
    const map = new Map<number, Mission>();
    for (const row of this.activeMissions()) {
      // If multiple entries exist for a tailId, the latest one wins.
      map.set(row.tailId, row.mission);
    }
    return map;
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
      const isOnActiveMission = context.activeMissionByTailId.has(uav.tailId);
      const marker = L.marker([pos.lat, pos.lon], {
        icon: createUavDivIcon(color, { isOnActiveMission }),
      });
      marker.bindTooltip(this.buildUavTooltip(uav, context), {
        className: MAP.TOOLTIP_TOOLTIP_CLASS,
        direction: 'top',
        offset: [MAP.TOOLTIP_TOOLTIP_OFFSET_X_PX, MAP.TOOLTIP_TOOLTIP_OFFSET_Y_PX],
        opacity: 1,
      });
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
        icon: createMissionDivIcon(
          pairing.mission.requiredUAVType,
          missionColor,
          resolvePriorityOutlineColor(pairing.mission.priority),
        ),
      });
      missionMarker.bindTooltip(
        this.buildMissionTooltip(pairing.mission),
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

  private buildUavTooltip(uav: UAV, context: AssignmentReviewMapRenderContext): string {
    const telemetry = this.resolveUavTooltipTelemetry(uav);
    const activeMission = context.activeMissionByTailId.get(uav.tailId) ?? null;
    return buildUavTooltipContent(uav, telemetry, { activeMission });
  }

  private resolveUavTooltipTelemetry(uav: UAV): Record<TelemetryField, number> {
    return this.uavTelemetryData()[uav.tailId] ?? uav.telemetryData;
  }

  private buildMissionTooltip(mission: Mission): string {
    return buildMissionTooltipContent(mission);
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
    this.layerGroup = null;
  }
}
