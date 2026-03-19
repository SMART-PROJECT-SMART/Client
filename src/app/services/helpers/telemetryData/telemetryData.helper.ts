import { TelemetryField } from '../../../common/enums';
import { UAVTelemetryData } from '../../../models';
import { UAVUpdateData } from '../../../models/cesium';

const field = (fields: Record<string, number>, ...keys: string[]): number => {
  for (const k of keys) {
    const v = fields[k];
    if (v !== undefined && v !== null && !Number.isNaN(v)) return v;
  }
  return 0;
};

export class TelemetryDataHelper {
  public static extractUpdateData(uavData: UAVTelemetryData): UAVUpdateData {
    const fields = uavData.fields as Record<string, number>;
    return {
      position: {
        latitude: field(fields, TelemetryField.Latitude, 'Latitude'),
        longitude: field(fields, TelemetryField.Longitude, 'Longitude'),
        height: field(fields, TelemetryField.Altitude, 'Altitude', 'Height'),
      },
      orientation: {
        yaw: field(fields, TelemetryField.YawDeg, 'YawDeg', 'Yaw'),
        pitch: field(fields, TelemetryField.PitchDeg, 'PitchDeg', 'Pitch'),
        roll: field(fields, TelemetryField.RollDeg, 'RollDeg', 'Roll'),
      },
    };
  }
}
