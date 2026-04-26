import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormControl } from '@angular/forms';

import type { UAVType } from '../../../../common/enums';
import { ClientConstants } from '../../../../common';
import type { AssignmentReviewMapMissionFilterOption } from '../../../../models/assignment/assignmentReviewMapMissionFilterOption.model';
import type { AssignmentReviewMapMissionTypeFilterOption } from '../../../../models/assignment/assignmentReviewMapMissionTypeFilterOption.model';
import type { AssignmentReviewMapUavFilterOption } from '../../../../models/assignment/assignmentReviewMapUavFilterOption.model';
import { applyUniqueSelection } from '../../utils/assignment-review-map-filter-selection.util';

const MAP = ClientConstants.AssignmentReviewMap;

@Component({
  selector: 'app-assignment-review-map-filters',
  standalone: false,
  templateUrl: './assignment-review-map-filters.component.html',
  styleUrl: './assignment-review-map-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentReviewMapFiltersComponent {
  readonly separateOverlapsOffLabel = MAP.OVERLAP_TOGGLE_OFF_LABEL;
  readonly separateOverlapsOnLabel = MAP.OVERLAP_TOGGLE_ON_LABEL;

  readonly missions = input.required<AssignmentReviewMapMissionFilterOption[]>();
  readonly missionTypes = input.required<AssignmentReviewMapMissionTypeFilterOption[]>();
  readonly uavs = input.required<AssignmentReviewMapUavFilterOption[]>();
  readonly selectedMissionIds = input.required<string[]>();
  readonly selectedMissionTypes = input.required<UAVType[]>();
  readonly selectedTailIds = input.required<number[]>();
  readonly separateOverlapsEnabled = input<boolean>(false);
  readonly showSeparateOverlapsToggle = input<boolean>(false);

  readonly selectedMissionIdsChange = output<string[]>();
  readonly selectedMissionTypesChange = output<UAVType[]>();
  readonly selectedTailIdsChange = output<number[]>();
  readonly clear = output<void>();
  readonly separateOverlapsToggle = output<void>();

  readonly missionQueryControl = new FormControl<string>('', { nonNullable: true });
  readonly missionTypeQueryControl = new FormControl<string>('', { nonNullable: true });
  readonly uavQueryControl = new FormControl<string>('', { nonNullable: true });

  readonly isOpen = signal(false);

  readonly selectedMissionIdSet = computed(() => new Set(this.selectedMissionIds()));
  readonly selectedMissionTypeSet = computed(() => new Set(this.selectedMissionTypes()));
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
      return (
        `${MAP.FILTER_UAV_SEARCH_PREFIX}${u.tailId}`.includes(q) ||
        u.tailId.toString().includes(q)
      );
    });
  });

  readonly filteredMissionTypeOptions = computed(() => {
    const q = this.missionTypeQueryControl.value.trim().toLowerCase();
    const selected = this.selectedMissionTypeSet();
    return this.missionTypes().filter((missionTypeOption: AssignmentReviewMapMissionTypeFilterOption) => {
      if (selected.has(missionTypeOption.uavType)) return true;
      if (!q) return true;
      return missionTypeOption.label.toLowerCase().includes(q);
    });
  });

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  close(): void {
    this.isOpen.set(false);
  }

  onToggleMission(missionId: string, checked: boolean): void {
    this.selectedMissionIdsChange.emit(
      applyUniqueSelection(this.selectedMissionIds(), missionId, checked),
    );
  }

  onToggleUav(tailId: number, checked: boolean): void {
    this.selectedTailIdsChange.emit(applyUniqueSelection(this.selectedTailIds(), tailId, checked));
  }

  onToggleMissionType(uavType: UAVType, checked: boolean): void {
    this.selectedMissionTypesChange.emit(
      applyUniqueSelection(this.selectedMissionTypes(), uavType, checked),
    );
  }

  onClear(): void {
    this.missionQueryControl.setValue('');
    this.missionTypeQueryControl.setValue('');
    this.uavQueryControl.setValue('');
    this.clear.emit();
  }

  onToggleSeparateOverlaps(): void {
    this.separateOverlapsToggle.emit();
  }
}

