import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  afterNextRender,
  effect,
  input,
  viewChild,
  ElementRef,
} from '@angular/core';
import * as L from 'leaflet';
import { TelemetryField } from '../../../../common/enums';
import { AssignmentUtil } from '../../../../common/utils';
import type { MissionAssignmentPairing, UAV } from '../../../../models';
import { extractLatLonFromUav } from '../../utils/assignment-uav-geography.util';
import {
  ASSIGNMENT_REVIEW_MAP_DEFAULT_CENTER_LAT,
  ASSIGNMENT_REVIEW_MAP_DEFAULT_CENTER_LON,
  ASSIGNMENT_REVIEW_MAP_DEFAULT_ZOOM,
  ASSIGNMENT_REVIEW_MAP_FIT_PADDING_PX,
  ASSIGNMENT_REVIEW_MAP_LINE_HUES,
  ASSIGNMENT_REVIEW_MAP_LINE_OPACITY,
  ASSIGNMENT_REVIEW_MAP_LINE_WEIGHT,
  ASSIGNMENT_REVIEW_MAP_MISSION_FILL,
  ASSIGNMENT_REVIEW_MAP_MISSION_RADIUS_PX,
  ASSIGNMENT_REVIEW_MAP_MISSION_STROKE,
  ASSIGNMENT_REVIEW_MAP_OS_TILE_TEMPLATE,
  ASSIGNMENT_REVIEW_MAP_TILE_ATTRIBUTION,
  ASSIGNMENT_REVIEW_MAP_UAV_COLOR_ASSIGNED,
  ASSIGNMENT_REVIEW_MAP_UAV_COLOR_UNASSIGNED,
  ASSIGNMENT_REVIEW_MAP_UAV_RADIUS_PX,
} from './assignment-review-map.constants';

@Component({
  selector: 'app-assignment-review-map',
  standalone: false,
  templateUrl: './assignment-review-map.component.html',
  styleUrl: './assignment-review-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentReviewMapComponent implements OnDestroy {
  readonly pairings = input.required<MissionAssignmentPairing[]>();
  readonly uavTelemetryData = input.required<Record<number, Record<TelemetryField, number>>>();
  readonly availableUavs = input.required<UAV[]>();
  readonly selectedTailIds = input.required<Map<string, number>>();

  readonly mapHost = viewChild<ElementRef<HTMLElement>>('mapHost');

  private map: L.Map | null = null;
  private layerGroup: L.LayerGroup | null = null;

  constructor() {
    afterNextRender(() => {
      this.ensureMap();
      this.syncLayers();
      const map = this.map;
      if (map) {
        queueMicrotask(() => map.invalidateSize());
      }
    });

    effect(() => {
      this.pairings();
      this.selectedTailIds();
      this.availableUavs();
      this.uavTelemetryData();
      if (!this.map) {
        return;
      }
      queueMicrotask(() => this.syncLayers());
    });
  }

  private ensureMap(): void {
    if (this.map) {
      return;
    }
    const host = this.mapHost()?.nativeElement;
    if (!host) {
      return;
    }
    this.map = L.map(host).setView(
      [ASSIGNMENT_REVIEW_MAP_DEFAULT_CENTER_LAT, ASSIGNMENT_REVIEW_MAP_DEFAULT_CENTER_LON],
      ASSIGNMENT_REVIEW_MAP_DEFAULT_ZOOM,
    );
    L.tileLayer(ASSIGNMENT_REVIEW_MAP_OS_TILE_TEMPLATE, {
      attribution: ASSIGNMENT_REVIEW_MAP_TILE_ATTRIBUTION,
    }).addTo(this.map);
    this.layerGroup = L.layerGroup().addTo(this.map);
  }

  private syncLayers(): void {
    const map = this.map;
    const group = this.layerGroup;
    if (!map || !group) {
      return;
    }
    group.clearLayers();
    const boundsPoints: L.LatLngExpression[] = [];
    const pairings = this.pairings();
    const selectedMap = this.selectedTailIds();
    const assignedTailIds = new Set<number>(selectedMap.values());
    const telemetry = this.uavTelemetryData();

    for (const uav of this.availableUavs()) {
      const pos = extractLatLonFromUav(uav);
      if (!pos) {
        continue;
      }
      const isAssigned = assignedTailIds.has(uav.tailId);
      const color = isAssigned
        ? ASSIGNMENT_REVIEW_MAP_UAV_COLOR_ASSIGNED
        : ASSIGNMENT_REVIEW_MAP_UAV_COLOR_UNASSIGNED;
      const marker = L.circleMarker([pos.lat, pos.lon], {
        radius: ASSIGNMENT_REVIEW_MAP_UAV_RADIUS_PX,
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 2,
      });
      marker.bindTooltip(`UAV ${uav.tailId}`);
      marker.addTo(group);
      boundsPoints.push([pos.lat, pos.lon]);
    }

    pairings.forEach((pairing, index) => {
      const loc = pairing.mission.location;
      boundsPoints.push([loc.latitude, loc.longitude]);
      const missionMarker = L.circleMarker([loc.latitude, loc.longitude], {
        radius: ASSIGNMENT_REVIEW_MAP_MISSION_RADIUS_PX,
        color: ASSIGNMENT_REVIEW_MAP_MISSION_STROKE,
        fillColor: ASSIGNMENT_REVIEW_MAP_MISSION_FILL,
        fillOpacity: 0.95,
        weight: 2,
      });
      missionMarker.bindTooltip(pairing.mission.title);
      missionMarker.addTo(group);

      const tailId = selectedMap.get(pairing.mission.id) ?? pairing.tailId;
      const snap = telemetry[tailId];
      if (!snap) {
        return;
      }
      const uav = AssignmentUtil.buildUavFromTelemetry(tailId, snap);
      const uavPos = extractLatLonFromUav(uav);
      if (!uavPos) {
        return;
      }
      const hue = ASSIGNMENT_REVIEW_MAP_LINE_HUES[index % ASSIGNMENT_REVIEW_MAP_LINE_HUES.length];
      const lineColor = `hsl(${hue}, 70%, 40%)`;
      L.polyline(
        [
          [uavPos.lat, uavPos.lon],
          [loc.latitude, loc.longitude],
        ],
        {
          color: lineColor,
          weight: ASSIGNMENT_REVIEW_MAP_LINE_WEIGHT,
          opacity: ASSIGNMENT_REVIEW_MAP_LINE_OPACITY,
        },
      ).addTo(group);
    });

    if (boundsPoints.length > 0) {
      map.fitBounds(L.latLngBounds(boundsPoints), {
        padding: [ASSIGNMENT_REVIEW_MAP_FIT_PADDING_PX, ASSIGNMENT_REVIEW_MAP_FIT_PADDING_PX],
      });
    } else {
      map.setView(
        [ASSIGNMENT_REVIEW_MAP_DEFAULT_CENTER_LAT, ASSIGNMENT_REVIEW_MAP_DEFAULT_CENTER_LON],
        ASSIGNMENT_REVIEW_MAP_DEFAULT_ZOOM,
      );
    }
    queueMicrotask(() => map.invalidateSize());
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
    this.layerGroup = null;
  }
}
