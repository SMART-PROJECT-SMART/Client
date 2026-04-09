import { Component, OnInit, signal, computed, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NavigationStart, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ArchiveApiService } from '../../../services/archive/archive-api.service';
import { ArchiveInvestigationReturnStateService } from '../../../services/archive/archive-investigation-return-state.service';
import type { ArchiveInvestigationRestorePayload } from '../../../services/archive/archive-investigation-return-state.service';
import type { ArchiveInvestigationUiSnapshot } from '../../../services/archive/archive-investigation-return-state.model';
import { DeviceManagerStorageService } from '../../../services/devices/device-manager-storage.service';
import { MissionStatusStorageService } from '../../../services/mission/mission-status-storage.service';
import type { ArchiveAssignmentRo } from '../../../models/archive';
import { ArchiveDiffDialogComponent } from '../components/archive-diff-dialog/archive-diff-dialog.component';
import { ArchiveFilterDialogComponent } from '../components/archive-filter-dialog/archive-filter-dialog.component';
import type { ArchiveFilterData } from './archive-filter-data.model';
import { buildComparisonRows, type ComparisonRow } from './archive-comparison.utils';
import { ClientConstants } from '../../../common';

const { INVESTIGATE_PATH_MARKER } = ClientConstants.ArchiveRoutes;

interface DisplayRecord {
  record: ArchiveAssignmentRo;
  formattedDate: string;
  rows: ComparisonRow[];
  changeCount: number;
  totalMissions: number;
}

@Component({
  selector: 'app-archive-page',
  standalone: false,
  templateUrl: './archive-page.component.html',
  styleUrl: './archive-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchivePageComponent implements OnInit {
  private readonly archiveApi = inject(ArchiveApiService);
  private readonly deviceStorage = inject(DeviceManagerStorageService);
  private readonly missionStatusStorage = inject(MissionStatusStorageService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly returnState = inject(ArchiveInvestigationReturnStateService);

  readonly selectedTabIndex = signal<number>(0);
  readonly activeMissionsSearchFilter = signal('');
  readonly assignments = signal<ArchiveAssignmentRo[]>([]);
  readonly loading = signal(false);
  readonly selectedDate = signal<string | null>(null);

  readonly tailIdFilter = signal<number[]>([]);
  readonly missionTypeFilter = signal<string[]>([]);
  readonly missionTitleFilter = signal<string[]>([]);
  readonly priorityFilter = signal<string[]>([]);

  readonly filteredRecords = computed(() => {
    const list = this.assignments();
    const tailIds = this.tailIdFilter();
    const types = this.missionTypeFilter();
    const titles = this.missionTitleFilter().map((t) => t.trim().toLowerCase()).filter(Boolean);
    const priorities = this.priorityFilter();
    if (tailIds.length === 0 && types.length === 0 && titles.length === 0 && priorities.length === 0) {
      return list;
    }
    return list.filter((record) => {
      const suggested = record.suggestedAssignments ?? [];
      const actual = record.actualAssignments ?? [];
      const all = [...suggested, ...actual];
      const matchUav =
        tailIds.length === 0 || all.some((a) => tailIds.includes(a.uavTailId));
      const matchType =
        types.length === 0 ||
        all.some((a) => types.includes(a.mission?.requiredUAVType ?? ''));
      const matchTitle =
        titles.length === 0 ||
        all.some((a) =>
          titles.some((t) => (a.mission?.title ?? '').toLowerCase().includes(t))
        );
      const matchPriority =
        priorities.length === 0 ||
        all.some((a) => priorities.includes(a.mission?.priority ?? ''));
      return matchUav && matchType && matchTitle && matchPriority;
    });
  });

  readonly displayRecords = computed<DisplayRecord[]>(() =>
    this.filteredRecords().map((record) => {
      const rows = buildComparisonRows(record.suggestedAssignments, record.actualAssignments);
      return {
        record,
        formattedDate: this.formatDate(record.createdAt),
        rows,
        changeCount: rows.filter((r) => r.changed).length,
        totalMissions: rows.length,
      };
    })
  );

  readonly pageIndex = signal(0);
  readonly pageSize = signal(ClientConstants.TableConfig.DEFAULT_PAGE_SIZE);
  readonly pageSizeOptions = ClientConstants.TableConfig.PAGE_SIZE_OPTIONS;

  readonly paginatedRecords = computed(() => {
    const all = this.displayRecords();
    const start = this.pageIndex() * this.pageSize();
    return all.slice(start, start + this.pageSize());
  });

  private readonly clampPageIndexToTotal = effect(() => {
    const total = this.displayRecords().length;
    const size = this.pageSize();
    if (size <= 0) return;
    const maxPage = Math.max(0, Math.ceil(total / size) - 1);
    const current = this.pageIndex();
    if (current > maxPage) {
      this.pageIndex.set(maxPage);
    }
  });

  private readonly captureStateOnInvestigateNavigation = this.router.events.pipe(
    filter((e): e is NavigationStart => e instanceof NavigationStart),
    filter((e) => e.url.includes(INVESTIGATE_PATH_MARKER)),
    takeUntilDestroyed(),
  ).subscribe(() => {
    this.returnState.saveArchiveUiSnapshot(this.buildUiSnapshot());
  });

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  ngOnInit(): void {
    firstValueFrom(this.deviceStorage.loadUAVs()).catch(() => {});
    firstValueFrom(this.missionStatusStorage.loadActiveMissions()).catch(() => {});
    void this.initializeArchiveState();
  }

  private async initializeArchiveState(): Promise<void> {
    const restored = this.returnState.tryConsumeRestore();
    if (restored) {
      await this.applyRestoredState(restored);
      return;
    }
    await this.loadLatest();
  }

  private buildUiSnapshot(): ArchiveInvestigationUiSnapshot {
    return {
      selectedTabIndex: this.selectedTabIndex(),
      activeMissionsSearchFilter: this.activeMissionsSearchFilter(),
      selectedDate: this.selectedDate(),
      tailIdFilter: [...this.tailIdFilter()],
      missionTypeFilter: [...this.missionTypeFilter()],
      missionTitleFilter: [...this.missionTitleFilter()],
      priorityFilter: [...this.priorityFilter()],
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
    };
  }

  private async applyRestoredState(restored: ArchiveInvestigationRestorePayload): Promise<void> {
    const { snapshot, diffRecord } = restored;
    this.selectedTabIndex.set(snapshot.selectedTabIndex);
    this.activeMissionsSearchFilter.set(snapshot.activeMissionsSearchFilter);
    this.tailIdFilter.set([...snapshot.tailIdFilter]);
    this.missionTypeFilter.set([...snapshot.missionTypeFilter]);
    this.missionTitleFilter.set([...snapshot.missionTitleFilter]);
    this.priorityFilter.set([...snapshot.priorityFilter]);
    this.pageSize.set(snapshot.pageSize);
    this.selectedDate.set(snapshot.selectedDate);

    this.loading.set(true);
    try {
      if (snapshot.selectedDate) {
        const list = await firstValueFrom(this.archiveApi.getByDate(snapshot.selectedDate));
        this.assignments.set(list ?? []);
      } else {
        const one = await firstValueFrom(this.archiveApi.getLatest());
        this.assignments.set(one ? [one] : []);
      }
    } finally {
      this.loading.set(false);
    }

    this.pageIndex.set(snapshot.pageIndex);

    const record = this.resolveDiffRecord(diffRecord);
    if (record) {
      queueMicrotask(() => {
        this.dialog.open(ArchiveDiffDialogComponent, {
          width: 'auto',
          minWidth: '400px',
          maxWidth: '900px',
          data: record,
        });
      });
    }
  }

  private resolveDiffRecord(diffRecord: ArchiveAssignmentRo | null): ArchiveAssignmentRo | null {
    if (!diffRecord) {
      return null;
    }
    const list = this.assignments();
    const fromList = list.find((r) => r.createdAt === diffRecord.createdAt);
    return fromList ?? diffRecord;
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }

  async loadLatest(): Promise<void> {
    this.loading.set(true);
    try {
      const one = await firstValueFrom(this.archiveApi.getLatest());
      this.assignments.set(one ? [one] : []);
    } finally {
      this.loading.set(false);
    }
  }

  async openFilterDialog(): Promise<void> {
    const ref = this.dialog.open(ArchiveFilterDialogComponent, {
      width: '380px',
      data: {
        date: this.selectedDate(),
        tailIds: this.tailIdFilter(),
        types: this.missionTypeFilter(),
        titles: this.missionTitleFilter(),
        priorities: this.priorityFilter(),
      } as ArchiveFilterData,
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === undefined) return;

    if (result.date && result.date !== this.selectedDate()) {
      this.loading.set(true);
      try {
        const list = await firstValueFrom(this.archiveApi.getByDate(result.date));
        this.assignments.set(list ?? []);
        this.selectedDate.set(result.date);
        this.tailIdFilter.set(result.tailIds);
        this.missionTypeFilter.set(result.types);
        this.missionTitleFilter.set(result.titles);
        this.priorityFilter.set(result.priorities);
      } finally {
        this.loading.set(false);
      }
    } else if (!result.date && this.selectedDate()) {
      this.selectedDate.set(null);
      this.tailIdFilter.set(result.tailIds);
      this.missionTypeFilter.set(result.types);
      this.missionTitleFilter.set(result.titles);
      this.priorityFilter.set(result.priorities);
      await this.loadLatest();
    } else {
      this.tailIdFilter.set(result.tailIds);
      this.missionTypeFilter.set(result.types);
      this.missionTitleFilter.set(result.titles);
      this.priorityFilter.set(result.priorities);
    }
  }

  openDiffDialog(record: ArchiveAssignmentRo): void {
    this.dialog.open(ArchiveDiffDialogComponent, {
      width: 'auto',
      minWidth: '400px',
      maxWidth: '900px',
      data: record,
    });
  }

  private formatDate(createdAt: string): string {
    if (!createdAt) return '—';
    const d = new Date(createdAt);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
