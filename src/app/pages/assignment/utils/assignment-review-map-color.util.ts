import { Priority, TelemetryField } from '../../../common/enums';
import { ClientConstants } from '../../../common/constants/clientConstants.constant';
import type { MissionAssignmentPairing } from '../../../models';

const MAP = ClientConstants.AssignmentReviewMap;

export function buildMissionColorMap(
  pairings: MissionAssignmentPairing[],
): Map<string, string> {
  const map = new Map<string, string>();
  pairings.forEach((pairing, index) => {
    const hue = MAP.LINE_HUES[index % MAP.LINE_HUES.length];
    map.set(pairing.mission.id, buildLineColor(hue));
  });
  return map;
}

export function buildTailColorMap(
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

export function resolvePriorityOutlineColor(priority: Priority): string {
  if (priority === Priority.High) {
    return MAP.PRIORITY_HIGH_OUTLINE_COLOR;
  }
  if (priority === Priority.Medium) {
    return MAP.PRIORITY_MEDIUM_OUTLINE_COLOR;
  }
  if (priority === Priority.Low) {
    return MAP.PRIORITY_LOW_OUTLINE_COLOR;
  }
  return MAP.PRIORITY_OUTLINE_DEFAULT_COLOR;
}

function buildLineColor(hue: number): string {
  return `hsl(${hue}, ${MAP.LINE_SATURATION_PERCENT}%, ${MAP.LINE_LIGHTNESS_PERCENT}%)`;
}
