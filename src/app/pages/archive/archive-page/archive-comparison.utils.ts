import type { ArchiveMissionToUavAssignmentRo } from '../../../models/archive';
import { TelemetryField } from '../../../common/enums';
import { EnumUtil } from '../../../common/utils';

export interface RelevantUav {
  tailId: number;
  isSuggested: boolean;
  isActual: boolean;
  telemetry: Record<string, number>;
}

export interface ComparisonRow {
  title: string;
  type: string;
  priority: string;
  suggestedTailId: number | null;
  actualTailId: number | null;
  changed: boolean;
  suggestedTelemetry: Record<string, number> | null;
  actualTelemetry: Record<string, number> | null;
  relevantUavs: RelevantUav[];
}

export function buildComparisonRows(
  suggested: ArchiveMissionToUavAssignmentRo[],
  actual: ArchiveMissionToUavAssignmentRo[],
  allUavTelemetryData?: Record<string, Record<string, number>>,
): ComparisonRow[] {
  const suggestedMap = new Map<string, ArchiveMissionToUavAssignmentRo>();
  for (const a of suggested) {
    suggestedMap.set(a.mission?.title ?? '', a);
  }

  const actualMap = new Map<string, ArchiveMissionToUavAssignmentRo>();
  for (const a of actual) {
    actualMap.set(a.mission?.title ?? '', a);
  }

  const priorityWeight: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const allTitles = new Set([...suggestedMap.keys(), ...actualMap.keys()]);
  const rows: ComparisonRow[] = [];

  for (const title of allTitles) {
    const s = suggestedMap.get(title);
    const a = actualMap.get(title);
    const suggestedTailId = s?.uavTailId ?? null;
    const actualTailId = a?.uavTailId ?? null;
    const missionType = s?.mission?.requiredUAVType ?? a?.mission?.requiredUAVType ?? '';

    const relevantUavs = buildRelevantUavs(
      missionType,
      suggestedTailId,
      actualTailId,
      allUavTelemetryData,
    );

    rows.push({
      title,
      type: missionType || '—',
      priority: s?.mission?.priority ?? a?.mission?.priority ?? '',
      suggestedTailId,
      actualTailId,
      changed: suggestedTailId !== actualTailId,
      suggestedTelemetry: s?.uavTelemetrySnapshot ?? null,
      actualTelemetry: a?.uavTelemetrySnapshot ?? null,
      relevantUavs,
    });
  }

  rows.sort((a, b) =>
    (priorityWeight[a.priority] ?? 3) - (priorityWeight[b.priority] ?? 3)
    || a.title.localeCompare(b.title)
  );

  return rows;
}

function buildRelevantUavs(
  missionType: string,
  suggestedTailId: number | null,
  actualTailId: number | null,
  allUavTelemetryData?: Record<string, Record<string, number>>,
): RelevantUav[] {
  if (!allUavTelemetryData) {
    return [];
  }

  const uavs: RelevantUav[] = [];

  for (const [tailIdStr, telemetry] of Object.entries(allUavTelemetryData)) {
    const tailId = Number(tailIdStr);
    const platformTypeValue = telemetry[TelemetryField.PlatformType];
    const uavType = EnumUtil.getUAVTypeFromPlatformNumber(platformTypeValue);

    if (uavType !== missionType) {
      continue;
    }

    uavs.push({
      tailId,
      isSuggested: tailId === suggestedTailId,
      isActual: tailId === actualTailId,
      telemetry,
    });
  }

  uavs.sort((a, b) => {
    if (a.isSuggested) return -1;
    if (b.isSuggested) return 1;
    if (a.isActual) return -1;
    if (b.isActual) return 1;
    return a.tailId - b.tailId;
  });

  return uavs;
}
