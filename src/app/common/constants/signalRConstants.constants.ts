import { TelemetryField } from '../enums';

export namespace SignalRConstants {
  export namespace LTS {
    export const BASE_URL: string = 'http://localhost:5096';
    export const HUB_ENDPOINT: string = '/hub/telemetry';
    export const RECEIVE_TELEMETRY_METHOD: string = 'ReceiveTelemetryData';
    export const WILDCARD_ALL_UAVS: number = -1;
  }

  export namespace Endpoints {
    export const UPDATE_WANTED_FIELDS: string = '/api/wanted-fields';
  }
}

export const defaultWantedFields: TelemetryField[] = [
  TelemetryField.Altitude,
  TelemetryField.Longitude,
  TelemetryField.Latitude,
  TelemetryField.YawDeg,
  TelemetryField.PitchDeg,
  TelemetryField.RollDeg,
  TelemetryField.CurrentSpeedKmph,
];
