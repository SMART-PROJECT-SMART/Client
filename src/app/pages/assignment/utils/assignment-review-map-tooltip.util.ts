import { TelemetryField } from '../../../common/enums';
import { ClientConstants } from '../../../common/constants/clientConstants.constant';
import { EnumUtil, TelemetryUtil } from '../../../common/utils';
import type { Mission } from '../../../models';

const MAP = ClientConstants.AssignmentReviewMap;

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

function formatTelemetryValue(field: TelemetryField, value: number): string {
  if (field === TelemetryField.Latitude || field === TelemetryField.Longitude) {
    return `${value.toFixed(MAP.TOOLTIP_LAT_LON_DECIMALS)}${MAP.TOOLTIP_VALUE_DEGREE_SUFFIX}`;
  }
  const unit = TelemetryUtil.getUnit(field).replace('(', '').replace(')', '');
  if (!unit) {
    return value.toFixed(MAP.TOOLTIP_VALUE_DECIMALS);
  }
  return `${value.toFixed(MAP.TOOLTIP_VALUE_DECIMALS)}${MAP.TOOLTIP_VALUE_SPACE}${unit}`;
}

function buildMissionLocationValue(latitude: number, longitude: number, altitude: number): string {
  const latitudeValue = `${MAP.TOOLTIP_MISSION_LATITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${latitude.toFixed(MAP.TOOLTIP_LAT_LON_DECIMALS)}${MAP.TOOLTIP_VALUE_DEGREE_SUFFIX}`;
  const longitudeValue = `${MAP.TOOLTIP_MISSION_LONGITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${longitude.toFixed(MAP.TOOLTIP_LAT_LON_DECIMALS)}${MAP.TOOLTIP_VALUE_DEGREE_SUFFIX}`;
  const altitudeValue = `${MAP.TOOLTIP_MISSION_ALTITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${formatTelemetryValue(TelemetryField.Altitude, altitude)}`;
  return [latitudeValue, longitudeValue, altitudeValue].join(MAP.TOOLTIP_MISSION_COORDINATE_SEPARATOR);
}
