import type { MissionTelemetryRo } from '../../../models/archive';

export function mergeMissionTelemetryRows(
  existing: MissionTelemetryRo[],
  incoming: MissionTelemetryRo[],
): MissionTelemetryRo[] {
  if (existing.length === 0) {
    return incoming;
  }
  return existing.map((point, index) => {
    const next = incoming[index];
    if (!next) {
      return point;
    }
    return {
      ...point,
      fields: { ...point.fields, ...next.fields },
    };
  });
}
