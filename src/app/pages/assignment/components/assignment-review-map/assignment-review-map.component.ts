import {
  ApplicationRef,
  Component,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnDestroy,
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
import { extractLatLonFromUav } from '../../utils/assignment-uav-geography.util';
import { resolvePriorityOutlineColor } from '../../utils/assignment-review-map-color.util';
import {
  renderMissionMarkersAndLinks,
  renderOverlapConnectors,
  renderUavMarkers,
} from '../../utils/assignment-review-map-layer-render.util';
import { fitMapToPointsOrDefault } from '../../utils/assignment-review-map-fit.util';
import {
  buildAssignmentReviewMapHighlightContext,
  buildAssignmentReviewMapMarkerPlacements,
  buildAssignmentReviewMapRenderContext,
} from '../../utils/assignment-review-map-context.util';
import { renderActiveMissionConnectors } from '../../utils/assignment-review-map-active-connectors.util';
import { AssignmentReviewMapUavInteractionFacade } from '../../utils/assignment-review-map-uav-interaction.facade';
import { AssignmentReviewMapTooltipFacade } from '../../utils/assignment-review-map-tooltip.facade';
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
  private readonly uavInteractionFacade = new AssignmentReviewMapUavInteractionFacade();
  private readonly tooltipFacade: AssignmentReviewMapTooltipFacade;

  public constructor(
    appRef: ApplicationRef,
    environmentInjector: EnvironmentInjector,
  ) {
    this.tooltipFacade = new AssignmentReviewMapTooltipFacade(
      appRef,
      environmentInjector,
      AssignmentReviewMapUavTooltipComponent,
      AssignmentReviewMapMissionTooltipComponent,
    );
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
    this.uavInteractionFacade.clearTemporaryDestinationMarker();
    this.tooltipFacade.clear();
    group.clearLayers();
    const boundsPoints: L.LatLngExpression[] = [];
    const context = this.buildRenderContext();
    const highlightContext = this.buildHighlightContext();
    const markerPlacements = buildAssignmentReviewMapMarkerPlacements(
      map,
      this.availableUavs(),
      context.pairings,
      this.separateOverlaps(),
      MAP.OVERLAP_THRESHOLD_PX,
      MAP.OVERLAP_FANOUT_RADIUS_PX,
    );
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
    renderActiveMissionConnectors(group, boundsPoints, context, this.availableUavs(), this.highlightTailIds());
    fitMapToPointsOrDefault(map, boundsPoints);
    queueMicrotask(() => map.invalidateSize());
  }

  private buildRenderContext(): AssignmentReviewMapRenderContext {
    return buildAssignmentReviewMapRenderContext({
      pairings: this.pairings(),
      selectedMap: this.selectedTailIds(),
      telemetry: this.uavTelemetryData(),
      activeMissions: this.activeMissions(),
      focusedMissionId: this.focusedMissionId(),
      compatibleTailIds: this.compatibleTailIds(),
      relativeScoreByTailId: this.relativeScoreByTailId(),
    });
  }

  private buildHighlightContext() {
    return buildAssignmentReviewMapHighlightContext({
      pairings: this.pairings(),
      selectedTailIdsByMissionId: this.selectedTailIds(),
      availableUavs: this.availableUavs(),
      focusedMissionId: this.focusedMissionId(),
      highlightMissionIds: this.highlightMissionIds(),
      highlightMissionTypes: this.highlightMissionTypes(),
      highlightUavTypes: this.highlightUavTypes(),
      highlightTailIds: this.highlightTailIds(),
    });
  }

  private onUavMarkerClick(
    uav: UAV,
    context: AssignmentReviewMapRenderContext,
    markerPosition: { latitude: number; longitude: number },
  ): void {
    const fitPoints = this.uavInteractionFacade.onUavMarkerClick(
      uav,
      context,
      markerPosition,
      this.layerGroup,
    );
    if (this.map && fitPoints) {
      fitMapToPointsOrDefault(this.map, fitPoints);
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
    return this.tooltipFacade.buildUavTooltip(uav, telemetry, activeMission, relativeScore);
  }

  private resolveUavTooltipTelemetry(uav: UAV): Record<TelemetryField, number> {
    return this.uavTelemetryData()[uav.tailId] ?? uav.telemetryData;
  }

  private buildMissionTooltip(mission: Mission): HTMLElement {
    return this.tooltipFacade.buildMissionTooltip(mission);
  }

  private onMissionMarkerClick(missionId: string): void {
    this.missionMarkerClick.emit(missionId);
  }

  public ngOnDestroy(): void {
    this.uavInteractionFacade.clearTemporaryDestinationMarker();
    this.tooltipFacade.clear();
    this.map?.remove();
    this.map = null;
    this.layerGroup = null;
  }
}
