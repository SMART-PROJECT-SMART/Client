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
  createTemporaryDestinationMarker,
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
  public readonly separateOverlaps = input<boolean>(false);

  public readonly mapHost = viewChild<ElementRef<HTMLElement>>('mapHost');

  private map: L.Map | null = null;
  private layerGroup: L.LayerGroup | null = null;
  private tooltipComponentRefs: ComponentRef<unknown>[] = [];
  private temporaryDestinationMarker: L.CircleMarker | null = null;
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
    );
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

  private onUavMarkerClick(uav: UAV, context: AssignmentReviewMapRenderContext): void {
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
    this.temporaryDestinationMarkerTailId = uav.tailId;
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
    return createTooltipHostElement(
      this.appRef,
      this.environmentInjector,
      AssignmentReviewMapUavTooltipComponent,
      (tooltipComponentRef) => {
        tooltipComponentRef.setInput('uav', uav);
        tooltipComponentRef.setInput('telemetry', telemetry);
        tooltipComponentRef.setInput('activeMission', activeMission);
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
    this.temporaryDestinationMarker = null;
    this.temporaryDestinationMarkerTailId = null;
  }
}
