import * as L from 'leaflet';
import type { AssignmentReviewMapRenderContext } from '../../../models/assignment/assignmentReviewMapRenderContext.model';
import type { UAV } from '../../../models';
import {
  createTemporaryDestinationConnector,
  createTemporaryDestinationMarker,
  removeTemporaryDestinationConnector,
  removeTemporaryDestinationMarker,
} from './assignment-review-map-temporary-marker.util';

type MapViewportSnapshot = {
  center: L.LatLngExpression;
  zoom: number;
};

export enum UavMarkerClickResultType {
  Fit = 'fit',
  Restore = 'restore',
}

export type UavMarkerClickResult =
  | { type: UavMarkerClickResultType.Fit; points: L.LatLngExpression[] }
  | { type: UavMarkerClickResultType.Restore; viewport: MapViewportSnapshot }
  | null;

export class AssignmentReviewMapUavInteractionFacade {
  private temporaryDestinationMarker: L.CircleMarker | null = null;
  private temporaryDestinationConnector: L.Polyline | null = null;
  private temporaryDestinationMarkerTailId: number | null = null;
  private viewportBeforeTemporaryFocus: MapViewportSnapshot | null = null;

  public onUavMarkerClick(
    uav: UAV,
    context: AssignmentReviewMapRenderContext,
    markerPosition: { latitude: number; longitude: number },
    map: L.Map | null,
    layerGroup: L.LayerGroup | null,
  ): UavMarkerClickResult {
    const activeMission = context.activeMissionByTailId.get(uav.tailId);
    if (!activeMission || !layerGroup || !map) {
      return null;
    }

    if (this.temporaryDestinationMarker && this.temporaryDestinationMarkerTailId === uav.tailId) {
      const viewport = this.viewportBeforeTemporaryFocus;
      this.clearTemporaryDestinationMarker();
      if (!viewport) {
        return null;
      }
      return { type: UavMarkerClickResultType.Restore, viewport };
    }

    this.clearTemporaryDestinationMarker();
    this.viewportBeforeTemporaryFocus = {
      center: map.getCenter(),
      zoom: map.getZoom(),
    };
    this.temporaryDestinationMarker = createTemporaryDestinationMarker(layerGroup, activeMission);
    this.temporaryDestinationConnector = createTemporaryDestinationConnector(
      layerGroup,
      markerPosition,
      activeMission,
    );
    this.temporaryDestinationMarkerTailId = uav.tailId;

    return {
      type: UavMarkerClickResultType.Fit,
      points: [
        [markerPosition.latitude, markerPosition.longitude],
        [activeMission.location.latitude, activeMission.location.longitude],
      ],
    };
  }

  public clearTemporaryDestinationMarker(): void {
    removeTemporaryDestinationMarker(this.temporaryDestinationMarker);
    removeTemporaryDestinationConnector(this.temporaryDestinationConnector);
    this.temporaryDestinationMarker = null;
    this.temporaryDestinationConnector = null;
    this.temporaryDestinationMarkerTailId = null;
    this.viewportBeforeTemporaryFocus = null;
  }
}
