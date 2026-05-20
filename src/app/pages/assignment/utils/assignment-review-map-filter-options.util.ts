import { UAVType } from '../../../common/enums';
import { EnumUtil } from '../../../common/utils';
import type { MissionAssignmentPairing, UAV } from '../../../models';
import type { AssignmentReviewMapMissionFilterOption } from '../../../models/assignment/assignmentReviewMapMissionFilterOption.model';
import type { AssignmentReviewMapMissionTypeFilterOption } from '../../../models/assignment/assignmentReviewMapMissionTypeFilterOption.model';
import type { AssignmentReviewMapUavFilterOption } from '../../../models/assignment/assignmentReviewMapUavFilterOption.model';

export function buildMapMissionFilterOptionsFromPairings(
  pairings: MissionAssignmentPairing[],
): AssignmentReviewMapMissionFilterOption[] {
  const missions = new Map<string, string>();
  for (const p of pairings) {
    missions.set(p.mission.id, p.mission.title);
  }
  return Array.from(missions.entries()).map(([missionId, title]) => ({ missionId, title }));
}

export function buildMapMissionTypeFilterOptionsFromPairings(
  pairings: MissionAssignmentPairing[],
): AssignmentReviewMapMissionTypeFilterOption[] {
  const seen = new Set<UAVType>();
  const out: AssignmentReviewMapMissionTypeFilterOption[] = [];
  for (const p of pairings) {
    const t = p.mission.requiredUAVType;
    if (seen.has(t)) {
      continue;
    }
    seen.add(t);
    out.push({ uavType: t, label: EnumUtil.getUAVTypeDisplay(t) });
  }
  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}

export function buildMapUavFilterOptionsFromUavs(uavs: UAV[]): AssignmentReviewMapUavFilterOption[] {
  return uavs.map((u) => ({
    tailId: u.tailId,
    uavType: u.uavType,
    label: EnumUtil.getUAVTypeDisplay(u.uavType),
  }));
}

export function buildMapUavTypeFilterOptionsFromUavs(
  uavs: UAV[],
): AssignmentReviewMapMissionTypeFilterOption[] {
  const seen = new Set<UAVType>();
  const out: AssignmentReviewMapMissionTypeFilterOption[] = [];
  for (const uav of uavs) {
    if (seen.has(uav.uavType)) {
      continue;
    }
    seen.add(uav.uavType);
    out.push({ uavType: uav.uavType, label: EnumUtil.getUAVTypeDisplay(uav.uavType) });
  }
  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}
