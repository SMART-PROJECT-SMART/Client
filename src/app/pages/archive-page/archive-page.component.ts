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
import { ArchiveApiService } from '../../services/archive/archive-api.service';
import type { ArchiveAssignmentRo, ArchiveFilterCriteria } from '../../models/archive';
import {
  ArchiveFilterDialogComponent,
  type ArchiveFilterDialogResult,
} from './archive-filter-dialog.component';
import { ArchiveDiffDialogComponent } from './archive-diff-dialog.component';

@Component({
  selector: 'app-archive-page',
  standalone: false,
  templateUrl: './archive-page.component.html',
  styleUrl: './archive-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchivePageComponent implements OnInit {
  private readonly archiveApi = inject(ArchiveApiService);
  private readonly dialog = inject(MatDialog);

  readonly assignments = signal<ArchiveAssignmentRo[]>([]);
  readonly selectedDate = signal<Date | null>(null);
  readonly filterCriteria = signal<ArchiveFilterCriteria>({});
  readonly loading = signal(false);

  readonly filteredRecords = computed(() => {
    const list = this.assignments();
    const criteria = this.filterCriteria();
    const uavTailId = criteria.uavTailId;
    const missionType = criteria.missionType?.trim();
    const missionTitle = criteria.missionTitle?.trim().toLowerCase();
    if (uavTailId == null && !missionType && !missionTitle) {
      return list;
    }
    return list.filter((record) => {
      const suggested = record.suggestedAssignments ?? [];
      const actual = record.actualAssignments ?? [];
      const all = [...suggested, ...actual];
      const matchUav =
        uavTailId == null || all.some((a) => a.uavTailId === uavTailId);
      const matchType =
        !missionType ||
        all.some((a) => (a.mission?.requiredUAVType ?? '') === missionType);
      const matchTitle =
        !missionTitle ||
        all.some((a) =>
          (a.mission?.title ?? '').toLowerCase().includes(missionTitle)
        );
      return matchUav && matchType && matchTitle;
    });
  });

  async ngOnInit(): Promise<void> {
    await this.loadLatest();
  }

  async loadLatest(): Promise<void> {
    this.loading.set(true);
    this.selectedDate.set(null);
    try {
      const one = await firstValueFrom(this.archiveApi.getLatest());
      this.assignments.set(one ? [one] : []);
    } finally {
      this.loading.set(false);
    }
  }

  openFilterDialog(): void {
    const ref = this.dialog.open(ArchiveFilterDialogComponent, {
      width: '420px',
      data: {
        loadDate: this.selectedDate()?.toISOString().slice(0, 10) ?? null,
        criteria: this.filterCriteria(),
      },
    });
    ref.afterClosed().subscribe((result: ArchiveFilterDialogResult | undefined) => {
      if (result === undefined) return;
      if (result.loadDate) {
        this.loadByDate(result.loadDate);
      }
      this.filterCriteria.set(result.criteria ?? {});
    });
  }

  async loadByDate(date: string): Promise<void> {
    this.loading.set(true);
    try {
      const list = await firstValueFrom(this.archiveApi.getByDate(date));
      this.assignments.set(list ?? []);
      this.selectedDate.set(new Date(date + 'T12:00:00'));
    } finally {
      this.loading.set(false);
    }
  }

  openDiffDialog(record: ArchiveAssignmentRo): void {
    this.dialog.open(ArchiveDiffDialogComponent, {
      width: '90vw',
      maxWidth: '1000px',
      data: record,
    });
  }

  formatCreatedAt(createdAt: string): string {
    if (!createdAt) return '—';
    const d = new Date(createdAt);
    return d.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }
}
