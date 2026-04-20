import {
  Component,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnDestroy,
  effect,
  input,
  viewChild,
  ElementRef,
} from '@angular/core';
import * as L from 'leaflet';
import { Priority, TelemetryField, UAVType } from '../../../../common/enums';
import { ClientConstants } from '../../../../common/constants/clientConstants.constant';
import { AssignmentUtil, EnumUtil, TelemetryUtil } from '../../../../common/utils';
import type { Mission, MissionAssignmentPairing, UAV } from '../../../../models';
import { extractLatLonFromUav } from '../../utils/assignment-uav-geography.util';
import { createMissionDivIcon, createUavDivIcon } from '../../utils/assignment-review-map-marker.util';

const MAP = ClientConstants.AssignmentReviewMap;
const UAV_TOOLTIP_ARMED_FIELDS: readonly TelemetryField[] = [TelemetryField.AmmoPercentage];
const UAV_TOOLTIP_SURVEILLANCE_FIELDS: readonly TelemetryField[] = [TelemetryField.DataStorageUsedGB];

type AssignmentReviewMapRenderContext = {
  pairings: MissionAssignmentPairing[];
  selectedMap: Map<string, number>;
  telemetry: Record<number, Record<TelemetryField, number>>;
  missionColors: Map<string, string>;
  tailColors: Map<number, string>;
};

@Component({
  selector: 'app-assignment-review-map',
  standalone: false,
  templateUrl: './assignment-review-map.component.html',
  styleUrl: './assignment-review-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentReviewMapComponent implements AfterViewInit, OnDestroy {
  readonly pairings = input.required<MissionAssignmentPairing[]>();
  readonly uavTelemetryData = input.required<Record<number, Record<TelemetryField, number>>>();
  readonly availableUavs = input.required<UAV[]>();
  readonly selectedTailIds = input.required<Map<string, number>>();

  readonly mapHost = viewChild<ElementRef<HTMLElement>>('mapHost');

  private map: L.Map | null = null;
  private layerGroup: L.LayerGroup | null = null;

  constructor() {
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

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.ensureMap();
      this.syncLayers();
      this.map?.invalidateSize();
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
      [MAP.DEFAULT_CENTER_LAT, MAP.DEFAULT_CENTER_LON],
      MAP.DEFAULT_ZOOM,
    );
    L.tileLayer(MAP.OS_TILE_TEMPLATE, {
      attribution: MAP.TILE_ATTRIBUTION,
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
    const context = this.buildRenderContext();
    this.renderUavMarkers(group, boundsPoints, context);
    this.renderMissionMarkersAndLinks(group, boundsPoints, context);
    this.fitMapToPoints(map, boundsPoints);
    queueMicrotask(() => map.invalidateSize());
  }

  private buildRenderContext(): AssignmentReviewMapRenderContext {
    const pairings = this.pairings();
    const selectedMap = this.selectedTailIds();
    const telemetry = this.uavTelemetryData();
    const missionColors = this.buildMissionColorMap(pairings);
    const tailColors = this.buildTailColorMap(pairings, selectedMap, missionColors);
    return {
      pairings,
      selectedMap,
      telemetry,
      missionColors,
      tailColors,
    };
  }

  private renderUavMarkers(
    group: L.LayerGroup,
    boundsPoints: L.LatLngExpression[],
    context: AssignmentReviewMapRenderContext,
  ): void {
    for (const uav of this.availableUavs()) {
      const pos = extractLatLonFromUav(uav);
      if (!pos) {
        continue;
      }
      const color = context.tailColors.get(uav.tailId) ?? MAP.UAV_COLOR_UNASSIGNED;
      const marker = L.marker([pos.lat, pos.lon], {
        icon: createUavDivIcon(color),
      });
      marker.bindTooltip(this.buildUavTooltip(uav), {
        className: MAP.TOOLTIP_TOOLTIP_CLASS,
        direction: 'top',
        offset: [MAP.TOOLTIP_TOOLTIP_OFFSET_X_PX, MAP.TOOLTIP_TOOLTIP_OFFSET_Y_PX],
        opacity: 1,
      });
      marker.addTo(group);
      boundsPoints.push([pos.lat, pos.lon]);
    }
  }

  private renderMissionMarkersAndLinks(
    group: L.LayerGroup,
    boundsPoints: L.LatLngExpression[],
    context: AssignmentReviewMapRenderContext,
  ): void {
    context.pairings.forEach((pairing) => {
      const loc = pairing.mission.location;
      boundsPoints.push([loc.latitude, loc.longitude]);
      const missionColor =
        context.missionColors.get(pairing.mission.id) ?? MAP.UAV_COLOR_UNASSIGNED;
      const missionMarker = L.marker([loc.latitude, loc.longitude], {
        icon: createMissionDivIcon(
          pairing.mission.requiredUAVType,
          missionColor,
          this.resolvePriorityOutlineColor(pairing.mission.priority),
        ),
      });
      missionMarker.bindTooltip(
        this.buildMissionTooltip(pairing.mission),
      );
      missionMarker.addTo(group);

      const uavPos = this.resolveAssignedUavPosition(pairing, context);
      if (!uavPos) {
        return;
      }

      L.polyline(
        [
          [uavPos.lat, uavPos.lon],
          [loc.latitude, loc.longitude],
        ],
        {
          color: missionColor,
          weight: MAP.LINE_WEIGHT,
          opacity: MAP.LINE_OPACITY,
        },
      ).addTo(group);
    });
  }

  private resolveAssignedUavPosition(
    pairing: MissionAssignmentPairing,
    context: AssignmentReviewMapRenderContext,
  ): { lat: number; lon: number } | null {
    const tailId = context.selectedMap.get(pairing.mission.id) ?? pairing.tailId;
    const snap = context.telemetry[tailId];
    if (!snap) {
      return null;
    }
    const uav = AssignmentUtil.buildUavFromTelemetry(tailId, snap);
    return extractLatLonFromUav(uav);
  }

  private fitMapToPoints(map: L.Map, boundsPoints: L.LatLngExpression[]): void {
    if (boundsPoints.length > 0) {
      map.fitBounds(L.latLngBounds(boundsPoints), {
        padding: [MAP.FIT_PADDING_PX, MAP.FIT_PADDING_PX],
      });
      return;
    }
    map.setView([MAP.DEFAULT_CENTER_LAT, MAP.DEFAULT_CENTER_LON], MAP.DEFAULT_ZOOM);
  }

  private buildMissionColorMap(pairings: MissionAssignmentPairing[]): Map<string, string> {
    const map = new Map<string, string>();
    pairings.forEach((pairing, index) => {
      const hue = MAP.LINE_HUES[index % MAP.LINE_HUES.length];
      map.set(pairing.mission.id, this.buildLineColor(hue));
    });
    return map;
  }

  private buildLineColor(hue: number): string {
    return `hsl(${hue}, ${MAP.LINE_SATURATION_PERCENT}%, ${MAP.LINE_LIGHTNESS_PERCENT}%)`;
  }

  private buildUavTooltip(uav: UAV): string {
    const telemetry = this.resolveUavTooltipTelemetry(uav);
    const title = `${MAP.TOOLTIP_UAV_PREFIX}${uav.tailId}`;
    const type = EnumUtil.getUAVTypeDisplay(uav.uavType);
    const positionRows = [
      this.buildUavTooltipRow(TelemetryField.Latitude, telemetry[TelemetryField.Latitude]),
      this.buildUavTooltipRow(TelemetryField.Longitude, telemetry[TelemetryField.Longitude]),
      this.buildUavTooltipRow(TelemetryField.Altitude, telemetry[TelemetryField.Altitude]),
    ];
    const statusRows = this.resolveStatusRows(uav.uavType, telemetry);
    return this.buildUavTooltipCard(title, type, positionRows, statusRows);
  }

  private resolveUavTooltipTelemetry(uav: UAV): Record<TelemetryField, number> {
    return this.uavTelemetryData()[uav.tailId] ?? uav.telemetryData;
  }

  private resolveStatusRows(
    uavType: UAVType,
    telemetry: Record<TelemetryField, number>,
  ): string[] {
    const fields =
      uavType === UAVType.Armed
        ? [TelemetryField.FuelAmount, ...UAV_TOOLTIP_ARMED_FIELDS]
        : [TelemetryField.FuelAmount, ...UAV_TOOLTIP_SURVEILLANCE_FIELDS];
    return fields.map((field) => this.buildUavTooltipRow(field, telemetry[field]));
  }

  private buildUavTooltipCard(
    title: string,
    type: string,
    positionRows: string[],
    statusRows: string[],
  ): string {
    return `
      <div class="ar-map-tooltip-card">
        <div class="ar-map-tooltip-card__header">
          <span class="ar-map-tooltip-card__title">${title}</span>
          <span class="${MAP.TOOLTIP_TYPE_BADGE_CLASS}">${type}</span>
        </div>
        <div class="ar-map-tooltip-card__section">
          <div class="ar-map-tooltip-card__section-title">${MAP.TOOLTIP_POSITION_SECTION_TITLE}</div>
          ${positionRows.join('')}
        </div>
        <div class="ar-map-tooltip-card__section ar-map-tooltip-card__section--status">
          <div class="ar-map-tooltip-card__section-title">${MAP.TOOLTIP_STATUS_SECTION_TITLE}</div>
          ${statusRows.join('')}
        </div>
      </div>
    `;
  }

  private buildUavTooltipRow(field: TelemetryField, value: number | undefined): string {
    const label = EnumUtil.getTelemetryFieldDisplay(field);
    const formattedValue = this.formatTelemetryValue(field, value);
    return `<div class="ar-map-tooltip-card__row"><span class="ar-map-tooltip-card__label">${label}</span><span class="ar-map-tooltip-card__value">${formattedValue}</span></div>`;
  }

  private formatTelemetryValue(field: TelemetryField, value: number | undefined): string {
    if (value === undefined || Number.isNaN(value)) {
      return MAP.TOOLTIP_VALUE_UNAVAILABLE;
    }
    if (field === TelemetryField.Latitude || field === TelemetryField.Longitude) {
      return `${value.toFixed(MAP.TOOLTIP_LAT_LON_DECIMALS)}${MAP.TOOLTIP_VALUE_DEGREE_SUFFIX}`;
    }
    const unit = TelemetryUtil.getUnit(field).replace('(', '').replace(')', '');
    const precision =
      field === TelemetryField.FuelAmount ||
      field === TelemetryField.AmmoPercentage ||
      field === TelemetryField.DataStorageUsedGB
        ? MAP.TOOLTIP_STATUS_VALUE_DECIMALS
        : MAP.TOOLTIP_VALUE_DECIMALS;
    if (!unit) {
      return value.toFixed(precision);
    }
    return `${value.toFixed(precision)}${MAP.TOOLTIP_VALUE_SPACE}${unit}`;
  }

  private buildMissionTooltip(mission: Mission): string {
    const missionType = EnumUtil.getUAVTypeDisplay(mission.requiredUAVType);
    const missionTitle = `${mission.title}${MAP.TOOLTIP_MISSION_SUFFIX_OPEN}${missionType}${MAP.TOOLTIP_MISSION_SUFFIX_CLOSE}`;
    const priorityLabel = EnumUtil.getPriorityDisplay(mission.priority);
    const priorityRow = `${MAP.TOOLTIP_MISSION_PRIORITY_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${priorityLabel}`;
    const locationValue = this.buildMissionLocationValue(
      mission.location.latitude,
      mission.location.longitude,
      mission.location.altitude,
    );
    const locationRow = `${MAP.TOOLTIP_MISSION_LOCATION_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${locationValue}`;
    return [missionTitle, priorityRow, locationRow].join(MAP.TOOLTIP_LINE_BREAK);
  }

  private buildMissionLocationValue(latitude: number, longitude: number, altitude: number): string {
    const latitudeValue = `${MAP.TOOLTIP_MISSION_LATITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${latitude.toFixed(MAP.TOOLTIP_LAT_LON_DECIMALS)}${MAP.TOOLTIP_VALUE_DEGREE_SUFFIX}`;
    const longitudeValue = `${MAP.TOOLTIP_MISSION_LONGITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${longitude.toFixed(MAP.TOOLTIP_LAT_LON_DECIMALS)}${MAP.TOOLTIP_VALUE_DEGREE_SUFFIX}`;
    const altitudeValue = `${MAP.TOOLTIP_MISSION_ALTITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${this.formatTelemetryValue(TelemetryField.Altitude, altitude)}`;
    return [latitudeValue, longitudeValue, altitudeValue].join(MAP.TOOLTIP_MISSION_COORDINATE_SEPARATOR);
  }

  private buildTailColorMap(
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

  private resolvePriorityOutlineColor(priority: Priority): string {
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

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
    this.layerGroup = null;
  }
}
