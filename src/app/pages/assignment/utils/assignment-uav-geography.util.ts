import { TelemetryField } from '../../../common/enums';
import type { UAV } from '../../../models';
import type { UavLatLon } from '../../../models/geographic/uavLatLon.model';

export function extractLatLonFromUav(uav: UAV): UavLatLon | null {
  const lat = uav.telemetryData[TelemetryField.Latitude];
  const lon = uav.telemetryData[TelemetryField.Longitude];
  if (
    lat === undefined ||
    lon === undefined ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return null;
  }
  return { lat, lon };
}
