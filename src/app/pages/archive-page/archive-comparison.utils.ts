import type { ArchiveMissionToUavAssignmentRo } from '../../models/archive';

export interface ComparisonRow {
  title: string;
  type: string;
  suggestedTailId: number | null;
  actualTailId: number | null;
  changed: boolean;
}

export function buildComparisonRows(
  suggested: ArchiveMissionToUavAssignmentRo[],
  actual: ArchiveMissionToUavAssignmentRo[],
): ComparisonRow[] {
  const suggestedMap = new Map<string, ArchiveMissionToUavAssignmentRo>();
  for (const a of suggested) {
    suggestedMap.set(a.mission?.title ?? '', a);
  }

  const actualMap = new Map<string, ArchiveMissionToUavAssignmentRo>();
  for (const a of actual) {
    actualMap.set(a.mission?.title ?? '', a);
  }

  const allTitles = new Set([...suggestedMap.keys(), ...actualMap.keys()]);
  const rows: ComparisonRow[] = [];

  for (const title of [...allTitles].sort()) {
    const s = suggestedMap.get(title);
    const a = actualMap.get(title);
    const suggestedTailId = s?.uavTailId ?? null;
    const actualTailId = a?.uavTailId ?? null;

    rows.push({
      title,
      type: s?.mission?.requiredUAVType ?? a?.mission?.requiredUAVType ?? '—',
      suggestedTailId,
      actualTailId,
      changed: suggestedTailId !== actualTailId,
    });
  }

  return rows;
}

export function countChanges(
  suggested: ArchiveMissionToUavAssignmentRo[],
  actual: ArchiveMissionToUavAssignmentRo[],
): number {
  return buildComparisonRows(suggested, actual).filter(r => r.changed).length;
}
