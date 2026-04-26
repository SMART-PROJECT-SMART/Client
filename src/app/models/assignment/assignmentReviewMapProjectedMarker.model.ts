import type * as L from 'leaflet';
import type { AssignmentReviewMapMarkerAnchor } from './assignmentReviewMapMarkerAnchor.model';

export type AssignmentReviewMapProjectedMarker = {
  anchor: AssignmentReviewMapMarkerAnchor;
  point: L.Point;
};
