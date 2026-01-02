import { Priority, UAVType, TelemetryField } from '../enums';

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
      [TelemetryField.TailId]: 'Tail ID',
      [TelemetryField.UAVTypeValue]: 'UAV Type Value',
    };
    return displayMap[field];
  }
}
