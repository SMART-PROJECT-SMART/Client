import {
  Component,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ArchiveApiService } from '../../../services/archive/archive-api.service';
import { DeviceManagerStorageService } from '../../../services/devices/device-manager-storage.service';
import type { ArchiveAssignmentRo } from '../../../models/archive';
import { ArchiveDiffDialogComponent } from '../components/archive-diff-dialog/archive-diff-dialog.component';
import { ArchiveFilterDialogComponent } from '../components/archive-filter-dialog/archive-filter-dialog.component';
import type { ArchiveFilterData } from './archive-filter-data.model';
import { buildComparisonRows, countChanges, type ComparisonRow } from './archive-comparison.utils';

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
  private readonly dialog = inject(MatDialog);

  readonly assignments = signal<ArchiveAssignmentRo[]>([]);
  readonly loading = signal(false);
  readonly selectedDate = signal<string | null>(null);

  readonly tailIdFilter = signal<number[]>([]);
  readonly missionTypeFilter = signal<string[]>([]);
  readonly missionTitleFilter = signal<string[]>([]);

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.tailIdFilter().length > 0) count++;
    if (this.missionTypeFilter().length > 0) count++;
    if (this.missionTitleFilter().length > 0) count++;
    return count;
  });

  readonly formattedDate = computed(() => {
    const raw = this.selectedDate();
    if (!raw) return null;
    const d = new Date(raw + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  });

  readonly filteredRecords = computed(() => {
    const list = this.assignments();
    const tailIds = this.tailIdFilter();
    const types = this.missionTypeFilter();
    const titles = this.missionTitleFilter().map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (tailIds.length === 0 && types.length === 0 && titles.length === 0) {
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
      return matchUav && matchType && matchTitle;
    });
  });

  async ngOnInit(): Promise<void> {
    firstValueFrom(this.deviceStorage.loadUAVs());
    await this.loadLatest();
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
      width: '400px',
      data: {
        date: this.selectedDate(),
        tailIds: this.tailIdFilter(),
        types: this.missionTypeFilter(),
        titles: this.missionTitleFilter(),
      } as ArchiveFilterData,
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result === undefined) return;

    // Load data if date changed
    if (result.date && result.date !== this.selectedDate()) {
      this.loading.set(true);
      try {
        const list = await firstValueFrom(this.archiveApi.getByDate(result.date));
        this.assignments.set(list ?? []);
        this.selectedDate.set(result.date);
      } finally {
        this.loading.set(false);
      }
    } else if (!result.date && this.selectedDate()) {
      // Date cleared — reload latest
      this.selectedDate.set(null);
      await this.loadLatest();
    }

    this.tailIdFilter.set(result.tailIds);
    this.missionTypeFilter.set(result.types);
    this.missionTitleFilter.set(result.titles);
  }

  removeDate(): void {
    this.selectedDate.set(null);
    this.loadLatest();
  }

  removeTailId(id: number): void {
    this.tailIdFilter.update((ids) => ids.filter((v) => v !== id));
  }

  removeType(type: string): void {
    this.missionTypeFilter.update((types) => types.filter((v) => v !== type));
  }

  removeTitleChip(title: string): void {
    this.missionTitleFilter.update((titles) => titles.filter((v) => v !== title));
  }

  clearFilters(): void {
    this.tailIdFilter.set([]);
    this.missionTypeFilter.set([]);
    this.missionTitleFilter.set([]);
  }

  openDiffDialog(record: ArchiveAssignmentRo): void {
    this.dialog.open(ArchiveDiffDialogComponent, {
      width: 'auto',
      minWidth: '400px',
      maxWidth: '700px',
      data: record,
    });
  }

  getChangeCount(record: ArchiveAssignmentRo): number {
    return countChanges(record.suggestedAssignments, record.actualAssignments);
  }

  getMissionSummaries(record: ArchiveAssignmentRo): ComparisonRow[] {
    return buildComparisonRows(record.suggestedAssignments, record.actualAssignments);
  }

  formatCreatedAt(createdAt: string): string {
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
