import { PlatformType } from '../enums';

export const TELEMETRY_PLATFORM_TYPE_ORDER: readonly PlatformType[] = Object.freeze(
  Object.values(PlatformType) as PlatformType[],
);

export const SimulationTelemetryCapacity = {
  FUEL_TANK_KG: {
    [PlatformType.Hermes900]: 350,
    [PlatformType.HeronTP]: 600,
    [PlatformType.Hermes450]: 180,
    [PlatformType.Searcher]: 120,
  } as const satisfies Record<PlatformType, number>,
  AMMO_TOTAL_ROUNDS: {
    [PlatformType.Hermes900]: 5,
    [PlatformType.HeronTP]: 7,
  } as Partial<Record<PlatformType, number>>,
  PERCENT_FULL_SCALE: 100,
} as const;
