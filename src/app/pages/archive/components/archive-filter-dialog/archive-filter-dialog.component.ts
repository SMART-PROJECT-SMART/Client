import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatChipInputEvent } from '@angular/material/chips';
import { DeviceManagerStorageService } from '../../../../services/devices/device-manager-storage.service';
import { UAVType } from '../../../../common/enums';
import type { ArchiveFilterData } from '../../archive-page/archive-filter-data.model';

@Component({
  selector: 'app-archive-filter-dialog',
  standalone: false,
  templateUrl: './archive-filter-dialog.component.html',
  styleUrl: './archive-filter-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchiveFilterDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ArchiveFilterDialogComponent>);
  private readonly deviceStorage = inject(DeviceManagerStorageService);
  private readonly data: ArchiveFilterData = inject(MAT_DIALOG_DATA, { optional: true }) ?? {
    date: null,
    tailIds: [],
    types: [],
    titles: [],
  };

  readonly today = new Date();
  readonly missionTypes = Object.values(UAVType);
  readonly availableTailIds = computed(() =>
    this.deviceStorage.uavList().map((u) => u.tailId).sort((a, b) => a - b)
  );

  readonly dateControl = new FormControl<Date | null>(
    this.data.date ? new Date(this.data.date + 'T12:00:00') : null
  );
  readonly tailIdControl = new FormControl<number[]>(this.data.tailIds ?? []);
  readonly typeControl = new FormControl<string[]>(this.data.types ?? []);
  readonly titles = signal<string[]>([...this.data.titles]);

  addTitle(event: MatChipInputEvent): void {
    const value = event.value?.trim();
    if (value) {
      this.titles.update((t) => [...t, value]);
    }
    event.chipInput.clear();
  }

  removeTitle(index: number): void {
    this.titles.update((t) => t.filter((_, i) => i !== index));
  }

  apply(): void {
    const d = this.dateControl.value;
    const date = d instanceof Date && !isNaN(d.getTime())
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      : null;

    this.dialogRef.close({
      date,
      tailIds: this.tailIdControl.value ?? [],
      types: this.typeControl.value ?? [],
      titles: this.titles(),
    } as ArchiveFilterData);
  }

  clear(): void {
    this.dateControl.reset();
    this.tailIdControl.reset([]);
    this.typeControl.reset([]);
    this.titles.set([]);
  }

  close(): void {
    this.dialogRef.close();
  }
}
