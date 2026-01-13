import { TelemetryField } from '../../../common/enums';
import { UAVTelemetryData } from '../../../models';
import { UAVUpdateData } from '../../../models/cesium';

export class TelemetryDataHelper {
  public static extractUpdateData(uavData: UAVTelemetryData): UAVUpdateData {
    const fields = uavData.fields;
    return {
      position: {
        latitude: fields[TelemetryField.Latitude] || 0,
        longitude: fields[TelemetryField.Longitude] || 0,
        height: fields[TelemetryField.Altitude] || 0,
      },
      orientation: {
        yaw: fields[TelemetryField.YawDeg] || 0,
        pitch: fields[TelemetryField.PitchDeg] || 0,
        roll: fields[TelemetryField.RollDeg] || 0,
      },
    };
  }
}
