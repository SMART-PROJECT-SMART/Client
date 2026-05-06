import * as L from 'leaflet';
import { ClientConstants } from '../../../common/constants/clientConstants.constant';
import type { Mission, UAV } from '../../../models';
import type { AssignmentReviewMapRenderContext } from '../../../models/assignment/assignmentReviewMapRenderContext.model';
import { extractLatLonFromUav } from './assignment-uav-geography.util';

const MAP = ClientConstants.AssignmentReviewMap;

export function renderActiveMissionConnectors(
  group: L.LayerGroup,
  boundsPoints: L.LatLngExpression[],
  context: AssignmentReviewMapRenderContext,
  availableUavs: UAV[],
  highlightedTailIds: Set<number>,
): void {
  const renderedDestinationMissionIds = new Set<string>();
  const tailIds =
    context.focusedMissionId
      ? context.compatibleTailIds
      : highlightedTailIds;

  for (const tailId of tailIds) {
    const activeMission = context.activeMissionByTailId.get(tailId);
    if (!activeMission) {
      continue;
    }

    const uav = availableUavs.find((candidate: UAV) => candidate.tailId === tailId);
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
      renderActiveMissionDestinationMarker(group, activeMission);
      renderedDestinationMissionIds.add(activeMission.id);
    }

    boundsPoints.push([uavPosition.lat, uavPosition.lon]);
    boundsPoints.push([activeMission.location.latitude, activeMission.location.longitude]);
  }
}

function renderActiveMissionDestinationMarker(
  group: L.LayerGroup,
  activeMission: Mission,
): void {
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
}
