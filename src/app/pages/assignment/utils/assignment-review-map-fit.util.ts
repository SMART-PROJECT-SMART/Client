import * as L from 'leaflet';
import { ClientConstants } from '../../../common/constants/clientConstants.constant';

const MAP = ClientConstants.AssignmentReviewMap;

export function fitMapToPointsOrDefault(map: L.Map, boundsPoints: L.LatLngExpression[]): void {
  if (boundsPoints.length > 0) {
    map.fitBounds(L.latLngBounds(boundsPoints), {
      padding: [MAP.FIT_PADDING_PX, MAP.FIT_PADDING_PX],
    });
    return;
  }
  map.setView([MAP.DEFAULT_CENTER_LAT, MAP.DEFAULT_CENTER_LON], MAP.DEFAULT_ZOOM);
}
