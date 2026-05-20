import type { MissionAssignmentPairing } from '../../../models/mission/missionAssignmentPairing.model';
import type { UAV } from '../../../models/uav/uav.model';
import type { AssignmentReviewMapMarkerAnchor } from '../../../models/assignment/assignmentReviewMapMarkerAnchor.model';
import { extractLatLonFromUav } from './assignment-uav-geography.util';
import {
  buildMapMissionPlacementKey,
  buildMapUavPlacementKey,
} from './assignment-review-map-placement-key.util';

export function buildMapMarkerAnchors(
  availableUavs: UAV[],
  pairings: MissionAssignmentPairing[],
): AssignmentReviewMapMarkerAnchor[] {
  const anchors: AssignmentReviewMapMarkerAnchor[] = [];

  for (const uav of availableUavs) {
    const pos = extractLatLonFromUav(uav);
    if (!pos) {
      continue;
    }
    anchors.push({
      key: buildMapUavPlacementKey(uav.tailId),
      latitude: pos.lat,
      longitude: pos.lon,
    });
  }

  for (const pairing of pairings) {
    anchors.push({
      key: buildMapMissionPlacementKey(pairing.mission.id),
      latitude: pairing.mission.location.latitude,
      longitude: pairing.mission.location.longitude,
    });
  }

  return anchors;
}
