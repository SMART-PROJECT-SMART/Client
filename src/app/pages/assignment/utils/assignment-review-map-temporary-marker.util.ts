import * as L from 'leaflet';
import { ClientConstants } from '../../../common/constants/clientConstants.constant';
import type { Mission } from '../../../models';

const MAP = ClientConstants.AssignmentReviewMap;

export function createTemporaryDestinationMarker(
  layerGroup: L.LayerGroup,
  mission: Mission,
): L.CircleMarker {
  const marker = L.circleMarker(
    [mission.location.latitude, mission.location.longitude],
    {
      radius: MAP.TEMP_DESTINATION_MARKER_RADIUS_PX,
      color: MAP.TEMP_DESTINATION_MARKER_COLOR,
      fillColor: MAP.TEMP_DESTINATION_MARKER_COLOR,
      fillOpacity: MAP.TEMP_DESTINATION_MARKER_FILL_OPACITY,
      weight: MAP.TEMP_DESTINATION_MARKER_STROKE_WEIGHT,
    },
  );

  marker
    .bindTooltip(`${MAP.TEMP_DESTINATION_MARKER_LABEL_PREFIX}${mission.title}`, {
      className: MAP.TOOLTIP_TOOLTIP_CLASS,
      direction: MAP.TOOLTIP_DIRECTION,
      offset: [MAP.TOOLTIP_TOOLTIP_OFFSET_X_PX, MAP.TOOLTIP_TOOLTIP_OFFSET_Y_PX],
      opacity: MAP.LEAFLET_TOOLTIP_BIND_OPACITY,
    })
    .addTo(layerGroup);
  marker.openTooltip();

  return marker;
}

export function createTemporaryDestinationConnector(
  layerGroup: L.LayerGroup,
  from: { latitude: number; longitude: number },
  mission: Mission,
): L.Polyline {
  return L.polyline(
    [
      [from.latitude, from.longitude],
      [mission.location.latitude, mission.location.longitude],
    ],
    {
      color: MAP.TEMP_DESTINATION_MARKER_COLOR,
      weight: MAP.TEMP_DESTINATION_CONNECTOR_WEIGHT,
      opacity: MAP.TEMP_DESTINATION_CONNECTOR_OPACITY,
      dashArray: MAP.TEMP_DESTINATION_CONNECTOR_DASH,
    },
  ).addTo(layerGroup);
}

export function removeTemporaryDestinationMarker(marker: L.CircleMarker | null): void {
  if (!marker) {
    return;
  }
  marker.remove();
}

export function removeTemporaryDestinationConnector(connector: L.Polyline | null): void {
  if (!connector) {
    return;
  }
  connector.remove();
}

