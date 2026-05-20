import * as L from 'leaflet';
import type { AssignmentReviewMapMarkerAnchor } from '../../../models/assignment/assignmentReviewMapMarkerAnchor.model';
import type { AssignmentReviewMapMarkerPlacement } from '../../../models/assignment/assignmentReviewMapMarkerPlacement.model';
import type { AssignmentReviewMapProjectedMarker } from '../../../models/assignment/assignmentReviewMapProjectedMarker.model';

const NO_MARKERS = 0;
const SINGLE_MARKER = 1;
const HALF_TURN_RADIANS = 2 * Math.PI;

export function resolveMapMarkerPlacements(
  map: L.Map,
  markerAnchors: AssignmentReviewMapMarkerAnchor[],
  separateOverlaps: boolean,
  overlapThresholdPx: number,
  fanoutRadiusPx: number,
): Map<string, AssignmentReviewMapMarkerPlacement> {
  if (!separateOverlaps || markerAnchors.length === NO_MARKERS) {
    return markerAnchors.reduce<Map<string, AssignmentReviewMapMarkerPlacement>>((placements, anchor) => {
      placements.set(anchor.key, {
        key: anchor.key,
        actualLatitude: anchor.latitude,
        actualLongitude: anchor.longitude,
        placedLatitude: anchor.latitude,
        placedLongitude: anchor.longitude,
        isDisplaced: false,
      });
      return placements;
    }, new Map<string, AssignmentReviewMapMarkerPlacement>());
  }

  const layerPoints = markerAnchors.map((anchor) => ({
    anchor,
    point: map.latLngToLayerPoint([anchor.latitude, anchor.longitude]),
  }));
  const groups = buildOverlapGroups(layerPoints, overlapThresholdPx);
  const placements = new Map<string, AssignmentReviewMapMarkerPlacement>();

  for (const group of groups) {
    if (group.length === SINGLE_MARKER) {
      const marker = group[NO_MARKERS].anchor;
      placements.set(marker.key, {
        key: marker.key,
        actualLatitude: marker.latitude,
        actualLongitude: marker.longitude,
        placedLatitude: marker.latitude,
        placedLongitude: marker.longitude,
        isDisplaced: false,
      });
      continue;
    }

    const centroid = group.reduce<L.Point>(
      (sum, marker) => sum.add(marker.point),
      L.point(0, 0),
    ).divideBy(group.length);

    for (let index = 0; index < group.length; index += 1) {
      const marker = group[index];
      const angle = (index / group.length) * HALF_TURN_RADIANS;
      const displacedPoint = L.point(
        centroid.x + fanoutRadiusPx * Math.cos(angle),
        centroid.y + fanoutRadiusPx * Math.sin(angle),
      );
      const displacedLatLng = map.layerPointToLatLng(displacedPoint);
      placements.set(marker.anchor.key, {
        key: marker.anchor.key,
        actualLatitude: marker.anchor.latitude,
        actualLongitude: marker.anchor.longitude,
        placedLatitude: displacedLatLng.lat,
        placedLongitude: displacedLatLng.lng,
        isDisplaced: true,
      });
    }
  }

  return placements;
}

function buildOverlapGroups(
  layerPoints: AssignmentReviewMapProjectedMarker[],
  thresholdPx: number,
): AssignmentReviewMapProjectedMarker[][] {
  const groups: AssignmentReviewMapProjectedMarker[][] = [];
  const visited = new Set<number>();

  for (let seedIndex = 0; seedIndex < layerPoints.length; seedIndex += 1) {
    if (visited.has(seedIndex)) {
      continue;
    }

    const group: AssignmentReviewMapProjectedMarker[] = [];
    const queue: number[] = [seedIndex];
    visited.add(seedIndex);

    while (queue.length > NO_MARKERS) {
      const currentIndex = queue.shift();
      if (currentIndex === undefined) {
        continue;
      }

      const current = layerPoints[currentIndex];
      group.push(current);

      for (let candidateIndex = 0; candidateIndex < layerPoints.length; candidateIndex += 1) {
        if (visited.has(candidateIndex)) {
          continue;
        }

        const candidate = layerPoints[candidateIndex];
        if (current.point.distanceTo(candidate.point) <= thresholdPx) {
          visited.add(candidateIndex);
          queue.push(candidateIndex);
        }
      }
    }

    groups.push(group);
  }

  return groups;
}
