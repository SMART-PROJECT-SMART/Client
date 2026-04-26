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
import { TelemetryField, UAVType } from '../../../../common/enums';
import { ClientConstants } from '../../../../common/constants/clientConstants.constant';
import { AssignmentUtil } from '../../../../common/utils';
import type { Mission, MissionAssignmentPairing, UAV } from '../../../../models';
import type { ActiveMissionRo } from '../../../../models/Ro/activeMissionRo.ro';
import type { AssignmentReviewMapRenderContext } from '../../../../models/assignment/assignmentReviewMapRenderContext.model';
import type { AssignmentReviewMapHighlightContext } from '../../../../models/assignment/assignmentReviewMapHighlightContext.model';
import type { AssignmentReviewMapMarkerAnchor } from '../../../../models/assignment/assignmentReviewMapMarkerAnchor.model';
import type { AssignmentReviewMapMarkerPlacement } from '../../../../models/assignment/assignmentReviewMapMarkerPlacement.model';
import { extractLatLonFromUav } from '../../utils/assignment-uav-geography.util';
import {
  createMissionDivIcon,
  createUavDivIcon,
} from '../../utils/assignment-review-map-marker.util';
import {
  buildMissionColorMap,
  buildTailColorMap,
  resolvePriorityOutlineColor,
} from '../../utils/assignment-review-map-color.util';
import {
  buildMissionTooltipContent,
  buildUavTooltipContent,
} from '../../utils/assignment-review-map-tooltip.util';
import {
  resolveDimmedConnectorLineOpacity,
  resolveMissionHighlightOpacity,
  resolveUavHighlightOpacity,
} from '../../utils/assignment-review-map-highlight.util';
import { resolveMapMarkerPlacements } from '../../utils/assignment-review-map-overlap.util';

const MAP = ClientConstants.AssignmentReviewMap;

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
  readonly highlightMissionIds = input<Set<string>>(new Set());
  readonly highlightMissionTypes = input<Set<UAVType>>(new Set());
  readonly highlightTailIds = input<Set<number>>(new Set());
  readonly separateOverlaps = input<boolean>(false);

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
      this.highlightMissionIds();
      this.highlightMissionTypes();
      this.highlightTailIds();
      this.separateOverlaps();
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
    this.map = L.map(host, { attributionControl: false, zoomControl: false }).setView(
      [MAP.DEFAULT_CENTER_LAT, MAP.DEFAULT_CENTER_LON],
      MAP.DEFAULT_ZOOM,
    );
    L.tileLayer(MAP.OS_TILE_TEMPLATE, {
      attribution: '',
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
    const highlightContext = this.buildHighlightContext();
    const markerPlacements = this.buildMarkerPlacements(map, context);
    this.renderOverlapConnectors(group, markerPlacements);
    this.renderUavMarkers(group, boundsPoints, context, highlightContext, markerPlacements);
    this.renderMissionMarkersAndLinks(
      group,
      boundsPoints,
      context,
      highlightContext,
      markerPlacements,
    );
    this.fitMapToPoints(map, boundsPoints);
    queueMicrotask(() => map.invalidateSize());
  }

  private buildMarkerPlacements(
    map: L.Map,
    context: AssignmentReviewMapRenderContext,
  ): Map<string, AssignmentReviewMapMarkerPlacement> {
    const anchors = this.buildMarkerAnchors(context);
    return resolveMapMarkerPlacements(
      map,
      anchors,
      this.separateOverlaps(),
      MAP.OVERLAP_THRESHOLD_PX,
      MAP.OVERLAP_FANOUT_RADIUS_PX,
    );
  }

  private buildMarkerAnchors(context: AssignmentReviewMapRenderContext): AssignmentReviewMapMarkerAnchor[] {
    const anchors: AssignmentReviewMapMarkerAnchor[] = [];

    for (const uav of this.availableUavs()) {
      const pos = extractLatLonFromUav(uav);
      if (!pos) {
        continue;
      }
      anchors.push({
        key: this.buildUavPlacementKey(uav.tailId),
        latitude: pos.lat,
        longitude: pos.lon,
      });
    }

    for (const pairing of context.pairings) {
      anchors.push({
        key: this.buildMissionPlacementKey(pairing.mission.id),
        latitude: pairing.mission.location.latitude,
        longitude: pairing.mission.location.longitude,
      });
    }

    return anchors;
  }

  private renderOverlapConnectors(
    group: L.LayerGroup,
    markerPlacements: Map<string, AssignmentReviewMapMarkerPlacement>,
  ): void {
    if (!this.separateOverlaps()) {
      return;
    }

    for (const placement of markerPlacements.values()) {
      if (!placement.isDisplaced) {
        continue;
      }
      L.polyline(
        [
          [placement.actualLatitude, placement.actualLongitude],
          [placement.placedLatitude, placement.placedLongitude],
        ],
        {
          color: MAP.OVERLAP_CONNECTOR_COLOR,
          weight: MAP.OVERLAP_CONNECTOR_WEIGHT,
          opacity: MAP.OVERLAP_CONNECTOR_OPACITY,
          dashArray: MAP.OVERLAP_CONNECTOR_DASH,
        },
      ).addTo(group);
    }
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
      map.set(row.tailId, row.mission);
    }
    return map;
  }

  private buildHighlightContext(): AssignmentReviewMapHighlightContext {
    return {
      pairings: this.pairings(),
      selectedTailIdsByMissionId: this.selectedTailIds(),
      highlightMissionIds: this.highlightMissionIds(),
      highlightMissionTypes: this.highlightMissionTypes(),
      highlightTailIds: this.highlightTailIds(),
    };
  }

  private renderUavMarkers(
    group: L.LayerGroup,
    boundsPoints: L.LatLngExpression[],
    context: AssignmentReviewMapRenderContext,
    highlightContext: AssignmentReviewMapHighlightContext,
    markerPlacements: Map<string, AssignmentReviewMapMarkerPlacement>,
  ): void {
    for (const uav of this.availableUavs()) {
      const pos = extractLatLonFromUav(uav);
      if (!pos) {
        continue;
      }
      const placement = markerPlacements.get(this.buildUavPlacementKey(uav.tailId));
      const latitude = placement?.placedLatitude ?? pos.lat;
      const longitude = placement?.placedLongitude ?? pos.lon;
      const color = context.tailColors.get(uav.tailId) ?? MAP.UAV_COLOR_UNASSIGNED;
      const isOnActiveMission = context.activeMissionByTailId.has(uav.tailId);
      const uavOpacity = resolveUavHighlightOpacity(
        highlightContext,
        uav.tailId,
        MAP.FILTER_FULL_OPACITY,
        MAP.FILTER_DIMMED_OPACITY,
      );
      const marker = L.marker([latitude, longitude], {
        icon: createUavDivIcon(color, { isOnActiveMission, opacity: uavOpacity }),
      });
      marker.bindTooltip(this.buildUavTooltip(uav, context), {
        className: MAP.TOOLTIP_TOOLTIP_CLASS,
        direction: 'top',
        offset: [MAP.TOOLTIP_TOOLTIP_OFFSET_X_PX, MAP.TOOLTIP_TOOLTIP_OFFSET_Y_PX],
        opacity: MAP.LEAFLET_TOOLTIP_BIND_OPACITY,
      });
      marker.addTo(group);
      boundsPoints.push([latitude, longitude]);
    }
  }

  private renderMissionMarkersAndLinks(
    group: L.LayerGroup,
    boundsPoints: L.LatLngExpression[],
    context: AssignmentReviewMapRenderContext,
    highlightContext: AssignmentReviewMapHighlightContext,
    markerPlacements: Map<string, AssignmentReviewMapMarkerPlacement>,
  ): void {
    context.pairings.forEach((pairing) => {
      const loc = pairing.mission.location;
      const missionPlacement = markerPlacements.get(this.buildMissionPlacementKey(pairing.mission.id));
      const missionLatitude = missionPlacement?.placedLatitude ?? loc.latitude;
      const missionLongitude = missionPlacement?.placedLongitude ?? loc.longitude;
      boundsPoints.push([missionLatitude, missionLongitude]);
      const missionColor =
        context.missionColors.get(pairing.mission.id) ?? MAP.UAV_COLOR_UNASSIGNED;
      const missionOpacity = resolveMissionHighlightOpacity(
        highlightContext,
        pairing.mission.id,
        MAP.FILTER_FULL_OPACITY,
        MAP.FILTER_DIMMED_OPACITY,
      );
      const missionMarker = L.marker([missionLatitude, missionLongitude], {
        icon: createMissionDivIcon(
          pairing.mission.requiredUAVType,
          missionColor,
          resolvePriorityOutlineColor(pairing.mission.priority),
          { opacity: missionOpacity },
        ),
      });
      missionMarker.bindTooltip(this.buildMissionTooltip(pairing.mission));
      missionMarker.addTo(group);

      const uavPos = this.resolveAssignedUavPosition(pairing, context);
      if (!uavPos) {
        return;
      }

      const tailId = context.selectedMap.get(pairing.mission.id) ?? pairing.tailId;
      const uavPlacement = markerPlacements.get(this.buildUavPlacementKey(tailId));
      const uavLatitude = uavPlacement?.placedLatitude ?? uavPos.lat;
      const uavLongitude = uavPlacement?.placedLongitude ?? uavPos.lon;
      const uavOpacity = resolveUavHighlightOpacity(
        highlightContext,
        tailId,
        MAP.FILTER_FULL_OPACITY,
        MAP.FILTER_DIMMED_OPACITY,
      );
      const lineOpacity = resolveDimmedConnectorLineOpacity(
        missionOpacity,
        uavOpacity,
        highlightContext,
        MAP.FILTER_FULL_OPACITY,
        MAP.FILTER_DIMMED_OPACITY,
        MAP.LINE_OPACITY,
      );
      L.polyline(
        [
          [uavLatitude, uavLongitude],
          [missionLatitude, missionLongitude],
        ],
        {
          color: missionColor,
          weight: MAP.LINE_WEIGHT,
          opacity: lineOpacity,
        },
      ).addTo(group);
    });
  }

  private buildUavPlacementKey(tailId: number): string {
    return `uav-${tailId}`;
  }

  private buildMissionPlacementKey(missionId: string): string {
    return `mission-${missionId}`;
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
