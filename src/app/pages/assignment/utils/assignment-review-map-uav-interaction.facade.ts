import * as L from 'leaflet';
import type { AssignmentReviewMapRenderContext } from '../../../models/assignment/assignmentReviewMapRenderContext.model';
import type { UAV } from '../../../models';
import {
  createTemporaryDestinationConnector,
  createTemporaryDestinationMarker,
  removeTemporaryDestinationConnector,
  removeTemporaryDestinationMarker,
} from './assignment-review-map-temporary-marker.util';

export class AssignmentReviewMapUavInteractionFacade {
  private temporaryDestinationMarker: L.CircleMarker | null = null;
  private temporaryDestinationConnector: L.Polyline | null = null;
  private temporaryDestinationMarkerTailId: number | null = null;

  public onUavMarkerClick(
    uav: UAV,
    context: AssignmentReviewMapRenderContext,
    markerPosition: { latitude: number; longitude: number },
    layerGroup: L.LayerGroup | null,
  ): L.LatLngExpression[] | null {
    const activeMission = context.activeMissionByTailId.get(uav.tailId);
    if (!activeMission || !layerGroup) {
      return null;
    }

    if (this.temporaryDestinationMarker && this.temporaryDestinationMarkerTailId === uav.tailId) {
      this.clearTemporaryDestinationMarker();
      return null;
    }

    this.clearTemporaryDestinationMarker();
    this.temporaryDestinationMarker = createTemporaryDestinationMarker(layerGroup, activeMission);
    this.temporaryDestinationConnector = createTemporaryDestinationConnector(
      layerGroup,
      markerPosition,
      activeMission,
    );
    this.temporaryDestinationMarkerTailId = uav.tailId;

    return [
      [markerPosition.latitude, markerPosition.longitude],
      [activeMission.location.latitude, activeMission.location.longitude],
    ];
  }

  public clearTemporaryDestinationMarker(): void {
    removeTemporaryDestinationMarker(this.temporaryDestinationMarker);
    removeTemporaryDestinationConnector(this.temporaryDestinationConnector);
    this.temporaryDestinationMarker = null;
    this.temporaryDestinationConnector = null;
    this.temporaryDestinationMarkerTailId = null;
  }
}
