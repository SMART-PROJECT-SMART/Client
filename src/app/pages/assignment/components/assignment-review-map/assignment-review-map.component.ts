import {
  ApplicationRef,
  Component,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnDestroy,
  ComponentRef,
  EnvironmentInjector,
  effect,
  input,
  output,
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
import type { AssignmentReviewMapMarkerPlacement } from '../../../../models/assignment/assignmentReviewMapMarkerPlacement.model';
import { extractLatLonFromUav } from '../../utils/assignment-uav-geography.util';
import {
  buildMissionColorMap,
  buildTailColorMap,
  resolvePriorityOutlineColor,
} from '../../utils/assignment-review-map-color.util';
import {
  renderMissionMarkersAndLinks,
  renderOverlapConnectors,
  renderUavMarkers,
} from '../../utils/assignment-review-map-layer-render.util';
import { buildMapMarkerAnchors } from '../../utils/assignment-review-map-anchor.util';
import { fitMapToPointsOrDefault } from '../../utils/assignment-review-map-fit.util';
import { resolveMapMarkerPlacements } from '../../utils/assignment-review-map-overlap.util';
import {
  createTemporaryDestinationConnector,
  createTemporaryDestinationMarker,
  removeTemporaryDestinationConnector,
  removeTemporaryDestinationMarker,
} from '../../utils/assignment-review-map-temporary-marker.util';
import {
  createTooltipHostElement,
  destroyTooltipHostElements,
} from '../../utils/assignment-review-map-tooltip-host.util';
import { AssignmentReviewMapMissionTooltipComponent } from '../assignment-review-map-mission-tooltip/assignment-review-map-mission-tooltip.component';
import { AssignmentReviewMapUavTooltipComponent } from '../assignment-review-map-uav-tooltip/assignment-review-map-uav-tooltip.component';

const MAP = ClientConstants.AssignmentReviewMap;

@Component({
  selector: 'app-assignment-review-map',
  standalone: false,
  templateUrl: './assignment-review-map.component.html',
  styleUrl: './assignment-review-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentReviewMapComponent implements AfterViewInit, OnDestroy {
  public readonly pairings = input.required<MissionAssignmentPairing[]>();
  public readonly uavTelemetryData = input.required<Record<number, Record<TelemetryField, number>>>();
  public readonly availableUavs = input.required<UAV[]>();
  public readonly selectedTailIds = input.required<Map<string, number>>();
  public readonly activeMissions = input<ActiveMissionRo[]>([]);
  public readonly highlightMissionIds = input<Set<string>>(new Set());
  public readonly highlightMissionTypes = input<Set<UAVType>>(new Set());
  public readonly highlightUavTypes = input<Set<UAVType>>(new Set());
  public readonly highlightTailIds = input<Set<number>>(new Set());
  public readonly focusedMissionId = input<string | null>(null);
  public readonly compatibleTailIds = input<Set<number>>(new Set());
  public readonly relativeScoreByTailId = input<Map<number, number>>(new Map());
  public readonly separateOverlaps = input<boolean>(false);
  public readonly missionMarkerClick = output<string>();

  public readonly mapHost = viewChild<ElementRef<HTMLElement>>('mapHost');

  private map: L.Map | null = null;
  private layerGroup: L.LayerGroup | null = null;
  private tooltipComponentRefs: ComponentRef<unknown>[] = [];
  private temporaryDestinationMarker: L.CircleMarker | null = null;
  private temporaryDestinationConnector: L.Polyline | null = null;
  private temporaryDestinationMarkerTailId: number | null = null;

  public constructor(
    private readonly appRef: ApplicationRef,
    private readonly environmentInjector: EnvironmentInjector,
  ) {
    effect(() => {
      this.pairings();
      this.selectedTailIds();
      this.availableUavs();
      this.uavTelemetryData();
      this.activeMissions();
      this.highlightMissionIds();
      this.highlightMissionTypes();
      this.highlightUavTypes();
      this.highlightTailIds();
      this.focusedMissionId();
      this.compatibleTailIds();
      this.relativeScoreByTailId();
      this.separateOverlaps();
      if (!this.map) {
        return;
      }
      queueMicrotask(() => this.syncLayers());
    });
  }

  public ngAfterViewInit(): void {
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
    this.clearTemporaryDestinationMarker();
    this.clearTooltipComponents();
    group.clearLayers();
    const boundsPoints: L.LatLngExpression[] = [];
    const context = this.buildRenderContext();
    const highlightContext = this.buildHighlightContext();
    const markerPlacements = this.buildMarkerPlacements(map, context);
    renderOverlapConnectors(group, markerPlacements, this.separateOverlaps());
    renderUavMarkers(
      group,
      boundsPoints,
      this.availableUavs(),
      context,
      highlightContext,
      markerPlacements,
      this.buildUavTooltip.bind(this),
      this.onUavMarkerClick.bind(this),
    );
    renderMissionMarkersAndLinks(
      group,
      boundsPoints,
      context,
      highlightContext,
      markerPlacements,
      resolvePriorityOutlineColor,
      this.buildMissionTooltip.bind(this),
      this.resolveAssignedUavPosition.bind(this),
      this.onMissionMarkerClick.bind(this),
    );
    this.renderHighlightedActiveMissionConnectors(group, boundsPoints, context);
    fitMapToPointsOrDefault(map, boundsPoints);
    queueMicrotask(() => map.invalidateSize());
  }

  private buildMarkerPlacements(
    map: L.Map,
    context: AssignmentReviewMapRenderContext,
  ): Map<string, AssignmentReviewMapMarkerPlacement> {
    const anchors = buildMapMarkerAnchors(this.availableUavs(), context.pairings);
    return resolveMapMarkerPlacements(
      map,
      anchors,
      this.separateOverlaps(),
      MAP.OVERLAP_THRESHOLD_PX,
      MAP.OVERLAP_FANOUT_RADIUS_PX,
    );
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
      focusedMissionId: this.focusedMissionId(),
      compatibleTailIds: this.compatibleTailIds(),
      relativeScoreByTailId: this.relativeScoreByTailId(),
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
      uavTypeByTailId: this.buildUavTypeByTailIdMap(),
      focusedMissionId: this.focusedMissionId(),
      highlightMissionIds: this.highlightMissionIds(),
      highlightMissionTypes: this.highlightMissionTypes(),
      highlightUavTypes: this.highlightUavTypes(),
      highlightTailIds: this.highlightTailIds(),
    };
  }

  private buildUavTypeByTailIdMap(): Record<number, UAVType> {
    return this.availableUavs().reduce<Record<number, UAVType>>((accumulator: Record<number, UAVType>, uav: UAV) => {
      accumulator[uav.tailId] = uav.uavType;
      return accumulator;
    }, {});
  }

  private renderHighlightedActiveMissionConnectors(
    group: L.LayerGroup,
    boundsPoints: L.LatLngExpression[],
    context: AssignmentReviewMapRenderContext,
  ): void {
    const renderedDestinationMissionIds = new Set<string>();
    const focusedMissionId = context.focusedMissionId;
    const tailIds =
      focusedMissionId
        ? context.compatibleTailIds
        : this.highlightTailIds();

    for (const tailId of tailIds) {
      const activeMission = context.activeMissionByTailId.get(tailId);
      if (!activeMission) {
        continue;
      }

      const uav = this.availableUavs().find((candidate: UAV) => candidate.tailId === tailId);
      if (!uav) {
        continue;
      }

      const uavPosition = extractLatLonFromUav(uav);
      if (!uavPosition) {
        continue;
      }

      L.polyline(
        [
          [uavPosition.lat, uavPosition.lon],
          [activeMission.location.latitude, activeMission.location.longitude],
        ],
        {
          color: MAP.TEMP_DESTINATION_MARKER_COLOR,
          weight: MAP.TEMP_DESTINATION_CONNECTOR_WEIGHT,
          opacity: MAP.TEMP_DESTINATION_CONNECTOR_OPACITY,
          dashArray: MAP.TEMP_DESTINATION_CONNECTOR_DASH,
        },
      ).addTo(group);

      if (!renderedDestinationMissionIds.has(activeMission.id)) {
        L.circleMarker(
          [activeMission.location.latitude, activeMission.location.longitude],
          {
            radius: MAP.TEMP_DESTINATION_MARKER_RADIUS_PX,
            color: MAP.TEMP_DESTINATION_MARKER_COLOR,
            fillColor: MAP.TEMP_DESTINATION_MARKER_COLOR,
            fillOpacity: MAP.TEMP_DESTINATION_MARKER_FILL_OPACITY,
            weight: MAP.TEMP_DESTINATION_MARKER_STROKE_WEIGHT,
          },
        ).addTo(group);
        renderedDestinationMissionIds.add(activeMission.id);
      }

      boundsPoints.push([uavPosition.lat, uavPosition.lon]);
      boundsPoints.push([activeMission.location.latitude, activeMission.location.longitude]);
    }
  }

  private onUavMarkerClick(
    uav: UAV,
    context: AssignmentReviewMapRenderContext,
    markerPosition: { latitude: number; longitude: number },
  ): void {
    const activeMission = context.activeMissionByTailId.get(uav.tailId);
    if (!activeMission || !this.layerGroup) {
      return;
    }

    if (this.temporaryDestinationMarker && this.temporaryDestinationMarkerTailId === uav.tailId) {
      this.clearTemporaryDestinationMarker();
      return;
    }

    this.clearTemporaryDestinationMarker();
    this.temporaryDestinationMarker = createTemporaryDestinationMarker(this.layerGroup, activeMission);
    this.temporaryDestinationConnector = createTemporaryDestinationConnector(
      this.layerGroup,
      markerPosition,
      activeMission,
    );
    this.temporaryDestinationMarkerTailId = uav.tailId;
    if (this.map) {
      fitMapToPointsOrDefault(
        this.map,
        [
          [markerPosition.latitude, markerPosition.longitude],
          [activeMission.location.latitude, activeMission.location.longitude],
        ],
      );
    }
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

  private buildUavTooltip(uav: UAV, context: AssignmentReviewMapRenderContext): HTMLElement {
    const telemetry = this.resolveUavTooltipTelemetry(uav);
    const activeMission = context.activeMissionByTailId.get(uav.tailId) ?? null;
    const relativeScore = context.relativeScoreByTailId.get(uav.tailId) ?? null;
    return createTooltipHostElement(
      this.appRef,
      this.environmentInjector,
      AssignmentReviewMapUavTooltipComponent,
      (tooltipComponentRef) => {
        tooltipComponentRef.setInput('uav', uav);
        tooltipComponentRef.setInput('telemetry', telemetry);
        tooltipComponentRef.setInput('activeMission', activeMission);
        tooltipComponentRef.setInput('relativeScore', relativeScore);
      },
      this.tooltipComponentRefs,
    );
  }

  private resolveUavTooltipTelemetry(uav: UAV): Record<TelemetryField, number> {
    return this.uavTelemetryData()[uav.tailId] ?? uav.telemetryData;
  }

  private buildMissionTooltip(mission: Mission): HTMLElement {
    return createTooltipHostElement(
      this.appRef,
      this.environmentInjector,
      AssignmentReviewMapMissionTooltipComponent,
      (tooltipComponentRef) => {
        tooltipComponentRef.setInput('mission', mission);
      },
      this.tooltipComponentRefs,
    );
  }

  private onMissionMarkerClick(missionId: string): void {
    this.missionMarkerClick.emit(missionId);
  }

  public ngOnDestroy(): void {
    this.clearTemporaryDestinationMarker();
    this.clearTooltipComponents();
    this.map?.remove();
    this.map = null;
    this.layerGroup = null;
  }

  private clearTooltipComponents(): void {
    destroyTooltipHostElements(this.appRef, this.tooltipComponentRefs);
  }

  private clearTemporaryDestinationMarker(): void {
    removeTemporaryDestinationMarker(this.temporaryDestinationMarker);
    removeTemporaryDestinationConnector(this.temporaryDestinationConnector);
    this.temporaryDestinationMarker = null;
    this.temporaryDestinationConnector = null;
    this.temporaryDestinationMarkerTailId = null;
  }
}
