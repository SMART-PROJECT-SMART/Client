import type { MissionTelemetryBoundsRo } from '../../../models/archive';

export function isoQueryParamsFromDatetimeLocal(
  fromLocal: string,
  toLocal: string,
): { startTime?: string; endTime?: string } {
  if (!fromLocal || !toLocal) {
    return {};
  }
  return {
    startTime: new Date(fromLocal).toISOString(),
    endTime: new Date(toLocal).toISOString(),
  };
}

export function telemetryBoundsHasSamples(
  bounds: MissionTelemetryBoundsRo | null,
): bounds is MissionTelemetryBoundsRo & { firstTimestamp: string; lastTimestamp: string } {
  return Boolean(
    bounds &&
      bounds.totalCount > 0 &&
      bounds.firstTimestamp &&
      bounds.lastTimestamp,
  );
}
