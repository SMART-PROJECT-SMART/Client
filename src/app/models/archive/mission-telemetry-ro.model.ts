export interface MissionTelemetryRo {
  timestamp: string;
  tailId: number;
  fields: Record<string, number>;
}
