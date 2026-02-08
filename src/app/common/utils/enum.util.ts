import { Priority, UAVType, TelemetryField, PlatformType, BaseLocation } from '../enums';

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

  public static getPlatformTypeDisplay(platformType: PlatformType | number): string {
    const platformValues = Object.values(PlatformType);
    const resolvedType =
      typeof platformType === 'number' ? platformValues[platformType] : platformType;

    const displayMap: Record<PlatformType, string> = {
      [PlatformType.Hermes900]: 'Hermes 900',
      [PlatformType.HeronTP]: 'Heron TP',
      [PlatformType.Hermes450]: 'Hermes 450',
      [PlatformType.Searcher]: 'Searcher',
    };
    return displayMap[resolvedType as PlatformType] ?? String(platformType);
  }

  public static platformTypeToNumber(platformType: PlatformType): number {
    const mapping: Record<PlatformType, number> = {
      [PlatformType.Hermes900]: 0,
      [PlatformType.HeronTP]: 1,
      [PlatformType.Hermes450]: 2,
      [PlatformType.Searcher]: 3,
    };
    return mapping[platformType];
  }

  public static getBaseLocationDisplay(baseLocation: BaseLocation): string {
    const displayMap: Record<BaseLocation, string> = {
      [BaseLocation.Hatzerim]: 'Hatzerim Airbase',
      [BaseLocation.TelNof]: 'Tel Nof Airbase',
      [BaseLocation.RamatDavid]: 'Ramat David Airbase',
      [BaseLocation.Nevatim]: 'Nevatim Airbase',
      [BaseLocation.Ramon]: 'Ramon Airbase',
      [BaseLocation.Hatzor]: 'Hatzor Airbase',
      [BaseLocation.Palmachim]: 'Palmachim Airbase',
      [BaseLocation.Ovda]: 'Ovda Airbase',
    };
    return displayMap[baseLocation];
  }
}
