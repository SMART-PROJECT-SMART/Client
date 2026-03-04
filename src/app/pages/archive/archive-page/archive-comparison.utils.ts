import type { ArchiveMissionToUavAssignmentRo } from '../../../models/archive';

export interface ComparisonRow {
  title: string;
  type: string;
  priority: string;
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

  const priorityWeight: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const allTitles = new Set([...suggestedMap.keys(), ...actualMap.keys()]);
  const rows: ComparisonRow[] = [];

  for (const title of allTitles) {
    const s = suggestedMap.get(title);
    const a = actualMap.get(title);
    const suggestedTailId = s?.uavTailId ?? null;
    const actualTailId = a?.uavTailId ?? null;

    rows.push({
      title,
      type: s?.mission?.requiredUAVType ?? a?.mission?.requiredUAVType ?? '—',
      priority: s?.mission?.priority ?? a?.mission?.priority ?? '',
      suggestedTailId,
      actualTailId,
      changed: suggestedTailId !== actualTailId,
    });
  }

  rows.sort((a, b) =>
    (priorityWeight[a.priority] ?? 3) - (priorityWeight[b.priority] ?? 3)
    || a.title.localeCompare(b.title)
  );

  return rows;
}