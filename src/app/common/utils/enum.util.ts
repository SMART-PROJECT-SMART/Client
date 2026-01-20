import { Priority, UAVType, TelemetryField, PlatformType } from '../enums';

export class EnumUtil {
  public static getPriorityDisplay(priority: Priority): string {
    const displayMap: Record<Priority, string> = {
      [Priority.Low]: 'Low',
      [Priority.Medium]: 'Medium',
      [Priority.High]: 'High',
    };
    return displayMap[priority];
  }

  public static getUAVTypeDisplay(uavType: UAVType): string {
    const displayMap: Record<UAVType, string> = {
      [UAVType.Surveillance]: 'Surveillance',
      [UAVType.Armed]: 'Armed',
    };
    return displayMap[uavType];
  }

  public static getTelemetryFieldDisplay(field: TelemetryField): string {
    const displayMap: Record<TelemetryField, string> = {
      [TelemetryField.DragCoefficient]: 'Drag Coefficient',
      [TelemetryField.LiftCoefficient]: 'Lift Coefficient',
      [TelemetryField.ThrottlePercent]: 'Throttle Percent',
      [TelemetryField.CruiseAltitude]: 'Cruise Altitude',
      [TelemetryField.Latitude]: 'Latitude',
      [TelemetryField.LandingGearStatus]: 'Landing Gear Status',
      [TelemetryField.Longitude]: 'Longitude',
      [TelemetryField.Altitude]: 'Altitude',
      [TelemetryField.CurrentSpeedKmph]: 'Current Speed',
      [TelemetryField.YawDeg]: 'Yaw',
      [TelemetryField.PitchDeg]: 'Pitch',
      [TelemetryField.RollDeg]: 'Roll',
      [TelemetryField.ThrustAfterInfluence]: 'Thrust After Influence',
      [TelemetryField.FuelAmount]: 'Fuel Amount',
      [TelemetryField.DataStorageUsedGB]: 'Data Storage Used',
      [TelemetryField.FlightTimeSec]: 'Flight Time',
      [TelemetryField.SignalStrength]: 'Signal Strength',
      [TelemetryField.Rpm]: 'RPM',
      [TelemetryField.EngineDegrees]: 'Engine Temperature',
      [TelemetryField.NearestSleeveId]: 'Nearest Sleeve ID',
      [TelemetryField.TailId]: 'Tail Number',
      [TelemetryField.UAVTypeValue]: 'UAV Type Value',
      [TelemetryField.PlatformType]: 'Platform Type',
    };
    return displayMap[field];
  }

  public static getPlatformTypeDisplay(platformType: PlatformType): string {
    const displayMap: Record<PlatformType, string> = {
      [PlatformType.Hermes900]: 'Hermes 900',
      [PlatformType.HeronTP]: 'Heron TP',
      [PlatformType.Hermes450]: 'Hermes 450',
      [PlatformType.Searcher]: 'Searcher',
    };
    return displayMap[platformType];
  }
}
