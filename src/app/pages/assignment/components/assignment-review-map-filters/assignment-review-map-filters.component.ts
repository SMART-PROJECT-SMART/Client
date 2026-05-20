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
  public readonly separateOverlapsOffLabel = MAP.OVERLAP_TOGGLE_OFF_LABEL;
  public readonly separateOverlapsOnLabel = MAP.OVERLAP_TOGGLE_ON_LABEL;
  public readonly labels = MAP.FILTER_LABELS;

  public readonly missions = input.required<AssignmentReviewMapMissionFilterOption[]>();
  public readonly missionTypes = input.required<AssignmentReviewMapMissionTypeFilterOption[]>();
  public readonly uavTypes = input.required<AssignmentReviewMapMissionTypeFilterOption[]>();
  public readonly uavs = input.required<AssignmentReviewMapUavFilterOption[]>();
  public readonly selectedMissionIds = input.required<string[]>();
  public readonly selectedMissionTypes = input.required<UAVType[]>();
  public readonly selectedUavTypes = input.required<UAVType[]>();
  public readonly selectedTailIds = input.required<number[]>();
  public readonly separateOverlapsEnabled = input<boolean>(false);
  public readonly showSeparateOverlapsToggle = input<boolean>(false);

  public readonly selectedMissionIdsChange = output<string[]>();
  public readonly selectedMissionTypesChange = output<UAVType[]>();
  public readonly selectedUavTypesChange = output<UAVType[]>();
  public readonly selectedTailIdsChange = output<number[]>();
  public readonly clear = output<void>();
  public readonly separateOverlapsToggle = output<void>();

  public readonly missionQueryControl = new FormControl<string>('', { nonNullable: true });
  public readonly missionTypeQueryControl = new FormControl<string>('', { nonNullable: true });
  public readonly uavTypeQueryControl = new FormControl<string>('', { nonNullable: true });
  public readonly uavQueryControl = new FormControl<string>('', { nonNullable: true });

  public readonly isOpen = signal(false);

  public readonly selectedMissionIdSet = computed(() => new Set(this.selectedMissionIds()));
  public readonly selectedMissionTypeSet = computed(() => new Set(this.selectedMissionTypes()));
  public readonly selectedUavTypeSet = computed(() => new Set(this.selectedUavTypes()));
  public readonly selectedTailIdSet = computed(() => new Set(this.selectedTailIds()));

  public readonly filteredMissionOptions = computed(() => {
    const q = this.missionQueryControl.value.trim().toLowerCase();
    const selected = this.selectedMissionIdSet();
    return this.missions().filter((m: AssignmentReviewMapMissionFilterOption) => {
      if (selected.has(m.missionId)) return true;
      if (!q) return true;
      return m.title.toLowerCase().includes(q);
    });
  });

  public readonly filteredUavOptions = computed(() => {
    const q = this.uavQueryControl.value.trim().toLowerCase();
    const selected = this.selectedTailIdSet();
    return this.uavs().filter((u: AssignmentReviewMapUavFilterOption) => {
      if (selected.has(u.tailId)) return true;
      if (!q) return true;
      return (
        `${MAP.FILTER_UAV_SEARCH_PREFIX}${u.tailId}`.includes(q) ||
        u.tailId.toString().includes(q) ||
        u.label.toLowerCase().includes(q)
      );
    });
  });

  public readonly filteredMissionTypeOptions = computed(() => {
    const q = this.missionTypeQueryControl.value.trim().toLowerCase();
    const selected = this.selectedMissionTypeSet();
    return this.missionTypes().filter((missionTypeOption: AssignmentReviewMapMissionTypeFilterOption) => {
      if (selected.has(missionTypeOption.uavType)) return true;
      if (!q) return true;
      return missionTypeOption.label.toLowerCase().includes(q);
    });
  });

  public readonly filteredUavTypeOptions = computed(() => {
    const q = this.uavTypeQueryControl.value.trim().toLowerCase();
    const selected = this.selectedUavTypeSet();
    return this.uavTypes().filter((uavTypeOption: AssignmentReviewMapMissionTypeFilterOption) => {
      if (selected.has(uavTypeOption.uavType)) return true;
      if (!q) return true;
      return uavTypeOption.label.toLowerCase().includes(q);
    });
  });

  public toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  public close(): void {
    this.isOpen.set(false);
  }

  public onToggleMission(missionId: string, checked: boolean): void {
    this.selectedMissionIdsChange.emit(
      applyUniqueSelection(this.selectedMissionIds(), missionId, checked),
    );
  }

  public onToggleUav(tailId: number, checked: boolean): void {
    this.selectedTailIdsChange.emit(applyUniqueSelection(this.selectedTailIds(), tailId, checked));
  }

  public onToggleMissionType(uavType: UAVType, checked: boolean): void {
    this.selectedMissionTypesChange.emit(
      applyUniqueSelection(this.selectedMissionTypes(), uavType, checked),
    );
  }

  public onToggleUavType(uavType: UAVType, checked: boolean): void {
    this.selectedUavTypesChange.emit(
      applyUniqueSelection(this.selectedUavTypes(), uavType, checked),
    );
  }

  public onClear(): void {
    this.missionQueryControl.setValue('');
    this.missionTypeQueryControl.setValue('');
    this.uavTypeQueryControl.setValue('');
    this.uavQueryControl.setValue('');
    this.clear.emit();
  }

  public onToggleSeparateOverlaps(): void {
    this.separateOverlapsToggle.emit();
  }
}

