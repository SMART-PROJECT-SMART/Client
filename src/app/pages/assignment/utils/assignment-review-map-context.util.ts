import * as L from 'leaflet';
import { UAVType } from '../../../common/enums';
import type { TelemetryField } from '../../../common/enums';
import type { Mission, MissionAssignmentPairing, UAV } from '../../../models';
import type { AssignmentReviewMapHighlightContext } from '../../../models/assignment/assignmentReviewMapHighlightContext.model';
import type { AssignmentReviewMapMarkerPlacement } from '../../../models/assignment/assignmentReviewMapMarkerPlacement.model';
import type { AssignmentReviewMapRenderContext } from '../../../models/assignment/assignmentReviewMapRenderContext.model';
import { buildMissionColorMap, buildTailColorMap } from './assignment-review-map-color.util';
import { buildMapMarkerAnchors } from './assignment-review-map-anchor.util';
import { resolveMapMarkerPlacements } from './assignment-review-map-overlap.util';

export type BuildMapRenderContextParams = {
  pairings: MissionAssignmentPairing[];
  selectedMap: Map<string, number>;
  telemetry: Record<number, Record<TelemetryField, number>>;
  activeMissions: Array<{ tailId: number; mission: Mission }>;
  focusedMissionId: string | null;
  compatibleTailIds: Set<number>;
  relativeScoreByTailId: Map<number, number>;
};

export type BuildMapHighlightContextParams = {
  pairings: MissionAssignmentPairing[];
  selectedTailIdsByMissionId: Map<string, number>;
  availableUavs: UAV[];
  focusedMissionId: string | null;
  highlightMissionIds: Set<string>;
  highlightMissionTypes: Set<UAVType>;
  highlightUavTypes: Set<UAVType>;
  highlightTailIds: Set<number>;
};

export function buildAssignmentReviewMapRenderContext(
  params: BuildMapRenderContextParams,
): AssignmentReviewMapRenderContext {
  const missionColors = buildMissionColorMap(params.pairings);
  const tailColors = buildTailColorMap(params.pairings, params.selectedMap, missionColors);
  const activeMissionByTailId = buildActiveMissionByTailIdMap(params.activeMissions);

  return {
    pairings: params.pairings,
    selectedMap: params.selectedMap,
    telemetry: params.telemetry,
    missionColors,
    tailColors,
    activeMissionByTailId,
    focusedMissionId: params.focusedMissionId,
    compatibleTailIds: params.compatibleTailIds,
    relativeScoreByTailId: params.relativeScoreByTailId,
  };
}

export function buildAssignmentReviewMapHighlightContext(
  params: BuildMapHighlightContextParams,
): AssignmentReviewMapHighlightContext {
  return {
    pairings: params.pairings,
    selectedTailIdsByMissionId: params.selectedTailIdsByMissionId,
    uavTypeByTailId: buildUavTypeByTailIdMap(params.availableUavs),
    focusedMissionId: params.focusedMissionId,
    highlightMissionIds: params.highlightMissionIds,
    highlightMissionTypes: params.highlightMissionTypes,
    highlightUavTypes: params.highlightUavTypes,
    highlightTailIds: params.highlightTailIds,
  };
}

export function buildAssignmentReviewMapMarkerPlacements(
  map: L.Map,
  availableUavs: UAV[],
  pairings: MissionAssignmentPairing[],
  separateOverlaps: boolean,
  overlapThresholdPx: number,
  overlapFanoutRadiusPx: number,
): Map<string, AssignmentReviewMapMarkerPlacement> {
  const anchors = buildMapMarkerAnchors(availableUavs, pairings);
  return resolveMapMarkerPlacements(
    map,
    anchors,
    separateOverlaps,
    overlapThresholdPx,
    overlapFanoutRadiusPx,
  );
}

function buildActiveMissionByTailIdMap(activeMissions: Array<{ tailId: number; mission: Mission }>): Map<number, Mission> {
  const map = new Map<number, Mission>();
  for (const row of activeMissions) {
    map.set(row.tailId, row.mission);
  }
  return map;
}

function buildUavTypeByTailIdMap(availableUavs: UAV[]): Record<number, UAVType> {
  return availableUavs.reduce<Record<number, UAVType>>((accumulator: Record<number, UAVType>, uav: UAV) => {
    accumulator[uav.tailId] = uav.uavType;
    return accumulator;
  }, {});
}
