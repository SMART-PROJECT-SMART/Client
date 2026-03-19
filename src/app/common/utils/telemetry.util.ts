import { TelemetryField } from '../enums';
import { ClientConstants } from '../constants/clientConstants.constant';

const TelemetryUnits = ClientConstants.TelemetryUnits;

export class TelemetryUtil {
  public static getUnit(field: TelemetryField): string {
    const unitMap: Record<TelemetryField, string> = {
      [TelemetryField.DragCoefficient]: TelemetryUnits.DRAG_COEFFICIENT,
      [TelemetryField.LiftCoefficient]: TelemetryUnits.LIFT_COEFFICIENT,
      [TelemetryField.ThrottlePercent]: TelemetryUnits.THROTTLE_PERCENT,
      [TelemetryField.CruiseAltitude]: TelemetryUnits.CRUISE_ALTITUDE,
      [TelemetryField.Latitude]: TelemetryUnits.LATITUDE,
      [TelemetryField.LandingGearStatus]: TelemetryUnits.LANDING_GEAR_STATUS,
      [TelemetryField.Longitude]: TelemetryUnits.LONGITUDE,
      [TelemetryField.Altitude]: TelemetryUnits.ALTITUDE,
      [TelemetryField.CurrentSpeedKmph]: TelemetryUnits.CURRENT_SPEED_KMPH,
      [TelemetryField.YawDeg]: TelemetryUnits.YAW_DEG,
      [TelemetryField.PitchDeg]: TelemetryUnits.PITCH_DEG,
      [TelemetryField.RollDeg]: TelemetryUnits.ROLL_DEG,
      [TelemetryField.ThrustAfterInfluence]: TelemetryUnits.THRUST_AFTER_INFLUENCE,
      [TelemetryField.FuelAmount]: TelemetryUnits.FUEL_AMOUNT,
      [TelemetryField.DataStorageUsedGB]: TelemetryUnits.DATA_STORAGE_USED_GB,
      [TelemetryField.FlightTimeSec]: TelemetryUnits.FLIGHT_TIME_SEC,
      [TelemetryField.SignalStrength]: TelemetryUnits.SIGNAL_STRENGTH,
      [TelemetryField.Rpm]: TelemetryUnits.RPM,
      [TelemetryField.EngineDegrees]: TelemetryUnits.ENGINE_DEGREES,
      [TelemetryField.NearestSleeveId]: TelemetryUnits.NEAREST_SLEEVE_ID,
      [TelemetryField.TailId]: TelemetryUnits.TAIL_ID,
      [TelemetryField.UAVTypeValue]: TelemetryUnits.UAV_TYPE_VALUE,
      [TelemetryField.PlatformType]: TelemetryUnits.PLATFORM_TYPE,
    };
    const unit = unitMap[field];
    return unit ? `(${unit})` : '';
  }
}
