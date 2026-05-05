import { PlatformType, TelemetryField } from '../enums';
import {
  SimulationTelemetryCapacity,
  TELEMETRY_PLATFORM_TYPE_ORDER,
} from '../constants/simulationTelemetryCapacity.constant';

const { FUEL_TANK_KG, AMMO_TOTAL_ROUNDS, PERCENT_FULL_SCALE } = SimulationTelemetryCapacity;

export class TelemetryDisplayValueUtil {
  public static resolvePlatformType(
    fields: Partial<Record<TelemetryField, number>> | undefined,
  ): PlatformType | null {
    if (!fields) return null;
    const platformTypeIndex = fields[TelemetryField.PlatformType];
    if (platformTypeIndex === undefined || Number.isNaN(platformTypeIndex)) return null;
    const normalizedIndex = Math.floor(platformTypeIndex);
    if (normalizedIndex < 0 || normalizedIndex >= TELEMETRY_PLATFORM_TYPE_ORDER.length) return null;
    return TELEMETRY_PLATFORM_TYPE_ORDER[normalizedIndex];
  }

  public static toDisplayAmmoRounds(raw: number, platform: PlatformType | null): number | null {
    if (!platform) return null;
    const totalRounds = AMMO_TOTAL_ROUNDS[platform];
    if (totalRounds === undefined) return null;
    return (raw / PERCENT_FULL_SCALE) * totalRounds;
  }

  public static toDisplayFuelKg(raw: number, platform: PlatformType | null): number {
    if (!platform) return raw;
    const tankCapacityKg = FUEL_TANK_KG[platform];
    if (raw >= 0 && raw <= PERCENT_FULL_SCALE) {
      return (raw / PERCENT_FULL_SCALE) * tankCapacityKg;
    }
    return raw;
  }

  public static toChartOrTableValue(
    field: TelemetryField,
    raw: number,
    fields: Partial<Record<TelemetryField, number>> | undefined,
  ): number {
    if (field === TelemetryField.FuelAmount) {
      const platform = TelemetryDisplayValueUtil.resolvePlatformType(fields);
      return TelemetryDisplayValueUtil.toDisplayFuelKg(raw, platform);
    }
    if (field === TelemetryField.AmmoPercentage) {
      const platform = TelemetryDisplayValueUtil.resolvePlatformType(fields);
      const rounds = TelemetryDisplayValueUtil.toDisplayAmmoRounds(raw, platform);
      return rounds === null ? raw : rounds;
    }
    return raw;
  }
}
