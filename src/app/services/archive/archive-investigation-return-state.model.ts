export interface ArchiveInvestigationUiSnapshot {
  selectedTabIndex: number;
  activeMissionsSearchFilter: string;
  selectedDate: string | null;
  tailIdFilter: number[];
  missionTypeFilter: string[];
  missionTitleFilter: string[];
  priorityFilter: string[];
  pageIndex: number;
  pageSize: number;
}
