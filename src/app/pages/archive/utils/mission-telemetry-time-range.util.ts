import type { MissionTelemetryBoundsRo, TelemetryTimeRangeBounds } from '../../../models/archive';

export function clampMillisecondsIntervalToTelemetryBounds(
  fromMs: number,
  toMs: number,
  bounds: TelemetryTimeRangeBounds,
): { fromMs: number; toMs: number } {
  const bMin = new Date(bounds.first).getTime();
  const bMax = new Date(bounds.last).getTime();
  const nextFrom = Math.max(fromMs, bMin);
  const nextTo = Math.min(toMs, bMax);
  if (nextFrom > nextTo) {
    return { fromMs: bMin, toMs: bMax };
  }
  return { fromMs: nextFrom, toMs: nextTo };
}

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
