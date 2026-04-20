import { TelemetryField, UAVType } from '../../../common/enums';
import { ClientConstants } from '../../../common/constants/clientConstants.constant';
import { EnumUtil, TelemetryUtil } from '../../../common/utils';
import type { Mission, UAV } from '../../../models';

const MAP = ClientConstants.AssignmentReviewMap;
const UAV_TOOLTIP_ARMED_FIELDS: readonly TelemetryField[] = [TelemetryField.AmmoPercentage];
const UAV_TOOLTIP_SURVEILLANCE_FIELDS: readonly TelemetryField[] = [TelemetryField.DataStorageUsedGB];

export function buildUavTooltipContent(
  uav: UAV,
  telemetry: Record<TelemetryField, number>,
): string {
  const title = `${MAP.TOOLTIP_UAV_PREFIX}${uav.tailId}`;
  const type = EnumUtil.getUAVTypeDisplay(uav.uavType);
  const positionRows = [
    buildUavTooltipRow(TelemetryField.Latitude, telemetry[TelemetryField.Latitude]),
    buildUavTooltipRow(TelemetryField.Longitude, telemetry[TelemetryField.Longitude]),
    buildUavTooltipRow(TelemetryField.Altitude, telemetry[TelemetryField.Altitude]),
  ];
  const statusRows = resolveUavStatusRows(uav.uavType, telemetry);
  return buildUavTooltipCard(title, type, positionRows, statusRows);
}

export function buildMissionTooltipContent(mission: Mission): string {
  const missionType = EnumUtil.getUAVTypeDisplay(mission.requiredUAVType);
  const missionTitle = `${mission.title}${MAP.TOOLTIP_MISSION_SUFFIX_OPEN}${missionType}${MAP.TOOLTIP_MISSION_SUFFIX_CLOSE}`;
  const priorityLabel = EnumUtil.getPriorityDisplay(mission.priority);
  const priorityRow = `${MAP.TOOLTIP_MISSION_PRIORITY_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${priorityLabel}`;
  const locationValue = buildMissionLocationValue(
    mission.location.latitude,
    mission.location.longitude,
    mission.location.altitude,
  );
  const locationRow = `${MAP.TOOLTIP_MISSION_LOCATION_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${locationValue}`;
  return [missionTitle, priorityRow, locationRow].join(MAP.TOOLTIP_LINE_BREAK);
}

function resolveUavStatusRows(
  uavType: UAVType,
  telemetry: Record<TelemetryField, number>,
): string[] {
  const fields =
    uavType === UAVType.Armed
      ? [TelemetryField.FuelAmount, ...UAV_TOOLTIP_ARMED_FIELDS]
      : [TelemetryField.FuelAmount, ...UAV_TOOLTIP_SURVEILLANCE_FIELDS];
  return fields.map((field) => buildUavTooltipRow(field, telemetry[field]));
}

function buildUavTooltipCard(
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

function buildUavTooltipRow(field: TelemetryField, value: number | undefined): string {
  const label = EnumUtil.getTelemetryFieldDisplay(field);
  const formattedValue = formatTelemetryValue(field, value);
  return `<div class="ar-map-tooltip-card__row"><span class="ar-map-tooltip-card__label">${label}</span><span class="ar-map-tooltip-card__value">${formattedValue}</span></div>`;
}

function formatTelemetryValue(field: TelemetryField, value: number | undefined): string {
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

function buildMissionLocationValue(latitude: number, longitude: number, altitude: number): string {
  const latitudeValue = `${MAP.TOOLTIP_MISSION_LATITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${latitude.toFixed(MAP.TOOLTIP_LAT_LON_DECIMALS)}${MAP.TOOLTIP_VALUE_DEGREE_SUFFIX}`;
  const longitudeValue = `${MAP.TOOLTIP_MISSION_LONGITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${longitude.toFixed(MAP.TOOLTIP_LAT_LON_DECIMALS)}${MAP.TOOLTIP_VALUE_DEGREE_SUFFIX}`;
  const altitudeValue = `${MAP.TOOLTIP_MISSION_ALTITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${formatTelemetryValue(TelemetryField.Altitude, altitude)}`;
  return [latitudeValue, longitudeValue, altitudeValue].join(MAP.TOOLTIP_MISSION_COORDINATE_SEPARATOR);
}
