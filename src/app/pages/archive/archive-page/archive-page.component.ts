import { Component, OnInit, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ArchiveApiService } from '../../../services/archive/archive-api.service';
import { DeviceManagerStorageService } from '../../../services/devices/device-manager-storage.service';
import type { ArchiveAssignmentRo } from '../../../models/archive';
import { ArchiveDiffDialogComponent } from '../components/archive-diff-dialog/archive-diff-dialog.component';
import { ArchiveFilterDialogComponent } from '../components/archive-filter-dialog/archive-filter-dialog.component';
import type { ArchiveFilterData } from './archive-filter-data.model';
import { buildComparisonRows, type ComparisonRow } from './archive-comparison.utils';

interface DisplayRecord {
  record: ArchiveAssignmentRo;
  formattedDate: string;
  rows: ComparisonRow[];
  changeCount: number;
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
  private readonly dialog = inject(MatDialog);

  readonly assignments = signal<ArchiveAssignmentRo[]>([]);
  readonly loading = signal(false);
  readonly selectedDate = signal<string | null>(null);

  readonly tailIdFilter = signal<number[]>([]);
  readonly missionTypeFilter = signal<string[]>([]);
  readonly missionTitleFilter = signal<string[]>([]);

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

  readonly displayRecords = computed<DisplayRecord[]>(() =>
    this.filteredRecords().map((record) => {
      const rows = buildComparisonRows(record.suggestedAssignments, record.actualAssignments);
      return {
        record,
        formattedDate: this.formatDate(record.createdAt),
        rows,
        changeCount: rows.filter((r) => r.changed).length,
      };
    })
  );

  ngOnInit(): void {
    firstValueFrom(this.deviceStorage.loadUAVs()).catch(() => {});
    this.loadLatest();
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
      } finally {
        this.loading.set(false);
      }
    } else if (!result.date && this.selectedDate()) {
      this.selectedDate.set(null);
      this.tailIdFilter.set(result.tailIds);
      this.missionTypeFilter.set(result.types);
      this.missionTitleFilter.set(result.titles);
      await this.loadLatest();
    } else {
      this.tailIdFilter.set(result.tailIds);
      this.missionTypeFilter.set(result.types);
      this.missionTitleFilter.set(result.titles);
    }
  }

  openDiffDialog(record: ArchiveAssignmentRo): void {
    this.dialog.open(ArchiveDiffDialogComponent, {
      width: 'auto',
      minWidth: '400px',
      maxWidth: '700px',
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
