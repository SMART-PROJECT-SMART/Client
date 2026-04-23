import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { UAVType } from '../../../../common/enums';
import { ClientConstants } from '../../../../common';
import type { AssignmentPairingAlternative } from '../../../../models/assignment/assignmentPairingAlternative.model';
import type { AssignmentPairingInsight } from '../../../../models/assignment/assignmentPairingInsight.model';

const { AssignmentPageConstants } = ClientConstants;

@Component({
  selector: 'app-assignment-review-algorithm-panel',
  standalone: false,
  templateUrl: './assignment-review-algorithm-panel.component.html',
  styleUrl: './assignment-review-algorithm-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentReviewAlgorithmPanelComponent {
  readonly missionId = input.required<string>();
  readonly suggestedTailId = input.required<number>();
  readonly selectedTailId = input.required<number>();
  readonly missionRequiredUavType = input.required<UAVType>();
  readonly uavTypeByTailId = input.required<Record<number, UAVType>>();
  readonly insight = input<AssignmentPairingInsight | null>(null);

  readonly showOnMap = output<string>();

  readonly title = AssignmentPageConstants.ALGORITHM_PANEL_TITLE;
  readonly selectedLabel = AssignmentPageConstants.ALGORITHM_SELECTED_LABEL;
  readonly suggestedLabel = AssignmentPageConstants.ALGORITHM_SUGGESTED_LABEL;
  readonly alternativesLabel = AssignmentPageConstants.ALGORITHM_ALTERNATIVES_LABEL;
  readonly alternativesEmpty = AssignmentPageConstants.ALGORITHM_ALTERNATIVES_EMPTY;
  readonly showOnMapLabel = AssignmentPageConstants.SHOW_ON_MAP_LABEL;
  readonly deltaLabel = AssignmentPageConstants.SCORE_DELTA_LABEL;
  readonly decimals = AssignmentPageConstants.SCORE_DECIMALS;
  readonly telemetryLabel = AssignmentPageConstants.ALGORITHM_METRIC_TELEMETRY_LABEL;
  readonly distanceLabel = AssignmentPageConstants.ALGORITHM_METRIC_DISTANCE_LABEL;
  readonly priorityLabel = AssignmentPageConstants.ALGORITHM_METRIC_PRIORITY_LABEL;
  readonly mismatchLabel = AssignmentPageConstants.ALGORITHM_METRIC_MISMATCH_LABEL;
  readonly activeLabel = AssignmentPageConstants.ALGORITHM_METRIC_ACTIVE_LABEL;

  readonly selectedScore = computed<number | null>(() => {
    const insight = this.insight();
    if (!insight) {
      return null;
    }
    if (this.selectedTailId() === insight.suggestedTailId) {
      return insight.totalScore;
    }
    const alt = insight.alternatives.find((a) => a.tailId === this.selectedTailId());
    return alt?.totalScore ?? null;
  });

  readonly deltaVsSuggestion = computed<number | null>(() => {
    const selected = this.selectedScore();
    const insight = this.insight();
    if (selected === null || !insight) {
      return null;
    }
    return selected - insight.totalScore;
  });

  readonly rankedAlternatives = computed<AssignmentPairingAlternative[]>(() => {
    const requiredUavType = this.missionRequiredUavType();
    const uavTypes = this.uavTypeByTailId();

    return (
      this.insight()?.alternatives.filter((alternative) => uavTypes[alternative.tailId] === requiredUavType)
      ?? []
    );
  });

  onShowOnMap(): void {
    this.showOnMap.emit(this.missionId());
  }

  withSign(value: number | null): string {
    if (value === null) {
      return 'N/A';
    }
    return `${value > 0 ? '+' : ''}${value.toFixed(this.decimals)}`;
  }
}
