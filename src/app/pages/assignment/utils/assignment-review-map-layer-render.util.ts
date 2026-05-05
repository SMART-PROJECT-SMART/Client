import * as L from 'leaflet';
import { ClientConstants } from '../../../common/constants/clientConstants.constant';
import type { Mission, UAV } from '../../../models';
import type { AssignmentReviewMapHighlightContext } from '../../../models/assignment/assignmentReviewMapHighlightContext.model';
import type { AssignmentReviewMapMarkerPlacement } from '../../../models/assignment/assignmentReviewMapMarkerPlacement.model';
import type { AssignmentReviewMapRenderContext } from '../../../models/assignment/assignmentReviewMapRenderContext.model';
import { createMissionDivIcon, createUavDivIcon } from './assignment-review-map-marker.util';
import {
  resolveDimmedConnectorLineOpacity,
  resolveMissionHighlightOpacity,
  resolveUavHighlightOpacity,
} from './assignment-review-map-highlight.util';
import {
  buildMapMissionPlacementKey,
  buildMapUavPlacementKey,
} from './assignment-review-map-placement-key.util';
import { extractLatLonFromUav } from './assignment-uav-geography.util';

const MAP = ClientConstants.AssignmentReviewMap;

export function renderOverlapConnectors(
  group: L.LayerGroup,
  markerPlacements: Map<string, AssignmentReviewMapMarkerPlacement>,
  separateOverlaps: boolean,
): void {
  if (!separateOverlaps) {
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

export function renderUavMarkers(
  group: L.LayerGroup,
  boundsPoints: L.LatLngExpression[],
  availableUavs: UAV[],
  context: AssignmentReviewMapRenderContext,
  highlightContext: AssignmentReviewMapHighlightContext,
  markerPlacements: Map<string, AssignmentReviewMapMarkerPlacement>,
  buildUavTooltip: (uav: UAV, context: AssignmentReviewMapRenderContext) => HTMLElement,
  onUavClick?: (
    uav: UAV,
    context: AssignmentReviewMapRenderContext,
    markerPosition: { latitude: number; longitude: number },
  ) => void,
): void {
  for (const uav of availableUavs) {
    const pos = extractLatLonFromUav(uav);
    if (!pos) {
      continue;
    }
    const placement = markerPlacements.get(buildMapUavPlacementKey(uav.tailId));
    const latitude = placement?.placedLatitude ?? pos.lat;
    const longitude = placement?.placedLongitude ?? pos.lon;
    const color = context.tailColors.get(uav.tailId) ?? MAP.UAV_COLOR_UNASSIGNED;
    const isOnActiveMission = context.activeMissionByTailId.has(uav.tailId);
    const relativeScore = context.relativeScoreByTailId.get(uav.tailId);
    const relativeScoreText =
      relativeScore !== undefined
        ? `${relativeScore.toFixed(MAP.TACTICAL_SCORE_BADGE_DECIMALS)}${MAP.TACTICAL_SCORE_SUFFIX}`
        : null;
    const uavOpacity = resolveUavHighlightOpacity(
      highlightContext,
      uav.tailId,
      MAP.FILTER_FULL_OPACITY,
      MAP.FILTER_DIMMED_OPACITY,
    );
    const marker = L.marker([latitude, longitude], {
      icon: createUavDivIcon(color, {
        isOnActiveMission,
        opacity: uavOpacity,
        uavType: uav.uavType,
        relativeScoreText,
      }),
    });
    marker.bindTooltip(buildUavTooltip(uav, context), {
      className: MAP.TOOLTIP_TOOLTIP_CLASS,
      direction: MAP.TOOLTIP_DIRECTION,
      offset: [MAP.TOOLTIP_TOOLTIP_OFFSET_X_PX, MAP.TOOLTIP_TOOLTIP_OFFSET_Y_PX],
      opacity: MAP.LEAFLET_TOOLTIP_BIND_OPACITY,
    });
    if (onUavClick) {
      marker.on('click', () => onUavClick(uav, context, { latitude, longitude }));
    }
    marker.addTo(group);
    boundsPoints.push([latitude, longitude]);
  }
}

export function renderMissionMarkersAndLinks(
  group: L.LayerGroup,
  boundsPoints: L.LatLngExpression[],
  context: AssignmentReviewMapRenderContext,
  highlightContext: AssignmentReviewMapHighlightContext,
  markerPlacements: Map<string, AssignmentReviewMapMarkerPlacement>,
  resolvePriorityOutlineColor: (priority: Mission['priority']) => string,
  buildMissionTooltip: (mission: Mission) => HTMLElement,
  resolveAssignedUavPosition: (
    pairing: AssignmentReviewMapRenderContext['pairings'][number],
    context: AssignmentReviewMapRenderContext,
  ) => { lat: number; lon: number } | null,
  onMissionClick?: (missionId: string) => void,
): void {
  context.pairings.forEach((pairing) => {
    const loc = pairing.mission.location;
    const missionPlacement = markerPlacements.get(buildMapMissionPlacementKey(pairing.mission.id));
    const missionLatitude = missionPlacement?.placedLatitude ?? loc.latitude;
    const missionLongitude = missionPlacement?.placedLongitude ?? loc.longitude;
    boundsPoints.push([missionLatitude, missionLongitude]);
    const missionColor = context.missionColors.get(pairing.mission.id) ?? MAP.UAV_COLOR_UNASSIGNED;
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
    missionMarker.bindTooltip(buildMissionTooltip(pairing.mission), {
      className: MAP.TOOLTIP_TOOLTIP_CLASS,
      direction: MAP.TOOLTIP_DIRECTION,
      offset: [MAP.TOOLTIP_TOOLTIP_OFFSET_X_PX, MAP.TOOLTIP_TOOLTIP_OFFSET_Y_PX],
      opacity: MAP.LEAFLET_TOOLTIP_BIND_OPACITY,
    });
    if (onMissionClick) {
      missionMarker.on('click', () => onMissionClick(pairing.mission.id));
    }
    missionMarker.addTo(group);

    const uavPos = resolveAssignedUavPosition(pairing, context);
    if (!uavPos) {
      return;
    }

    const tailId = context.selectedMap.get(pairing.mission.id) ?? pairing.tailId;
    const uavPlacement = markerPlacements.get(buildMapUavPlacementKey(tailId));
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
