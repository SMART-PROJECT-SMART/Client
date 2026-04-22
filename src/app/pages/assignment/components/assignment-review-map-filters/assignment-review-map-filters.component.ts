import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormControl } from '@angular/forms';

import type { AssignmentReviewMapMissionFilterOption } from '../../../../models/assignment/assignmentReviewMapMissionFilterOption.model';
import type { AssignmentReviewMapUavFilterOption } from '../../../../models/assignment/assignmentReviewMapUavFilterOption.model';

@Component({
  selector: 'app-assignment-review-map-filters',
  standalone: false,
  templateUrl: './assignment-review-map-filters.component.html',
  styleUrl: './assignment-review-map-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentReviewMapFiltersComponent {
  readonly missions = input.required<AssignmentReviewMapMissionFilterOption[]>();
  readonly uavs = input.required<AssignmentReviewMapUavFilterOption[]>();
  readonly selectedMissionIds = input.required<string[]>();
  readonly selectedTailIds = input.required<number[]>();

  readonly selectedMissionIdsChange = output<string[]>();
  readonly selectedTailIdsChange = output<number[]>();
  readonly clear = output<void>();

  readonly missionQueryControl = new FormControl<string>('', { nonNullable: true });
  readonly uavQueryControl = new FormControl<string>('', { nonNullable: true });

  readonly isOpen = signal(false);

  readonly selectedMissionIdSet = computed(() => new Set(this.selectedMissionIds()));
  readonly selectedTailIdSet = computed(() => new Set(this.selectedTailIds()));

  readonly filteredMissionOptions = computed(() => {
    const q = this.missionQueryControl.value.trim().toLowerCase();
    const selected = this.selectedMissionIdSet();
    return this.missions().filter((m: AssignmentReviewMapMissionFilterOption) => {
      if (selected.has(m.missionId)) return true;
      if (!q) return true;
      return m.title.toLowerCase().includes(q);
    });
  });

  readonly filteredUavOptions = computed(() => {
    const q = this.uavQueryControl.value.trim().toLowerCase();
    const selected = this.selectedTailIdSet();
    return this.uavs().filter((u: AssignmentReviewMapUavFilterOption) => {
      if (selected.has(u.tailId)) return true;
      if (!q) return true;
      return `uav-${u.tailId}`.includes(q) || u.tailId.toString().includes(q);
    });
  });

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  close(): void {
    this.isOpen.set(false);
  }

  onToggleMission(missionId: string, checked: boolean): void {
    const selected = this.selectedMissionIds();
    const next = checked
      ? [...selected, missionId].filter((v, i, a) => a.indexOf(v) === i)
      : selected.filter((id: string) => id !== missionId);
    this.selectedMissionIdsChange.emit(next);
  }

  onToggleUav(tailId: number, checked: boolean): void {
    const selected = this.selectedTailIds();
    const next = checked
      ? [...selected, tailId].filter((v, i, a) => a.indexOf(v) === i)
      : selected.filter((id: number) => id !== tailId);
    this.selectedTailIdsChange.emit(next);
  }

  onClear(): void {
    this.missionQueryControl.setValue('');
    this.uavQueryControl.setValue('');
    this.clear.emit();
  }
}

