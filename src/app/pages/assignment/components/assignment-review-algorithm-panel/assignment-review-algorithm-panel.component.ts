import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Priority, UAVType } from '../../../../common/enums';
import { ClientConstants } from '../../../../common';
import { EnumUtil } from '../../../../common/utils';
import type { AssignmentPairingAlternative } from '../../../../models/assignment/assignmentPairingAlternative.model';
import type { AssignmentPairingInsight } from '../../../../models/assignment/assignmentPairingInsight.model';

const { AssignmentPageConstants } = ClientConstants;
const NO_PENALTY = 0;
const NO_SCORE = 0;
const CONFLICT_RISK_REASON_SCORE = 1;

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
  readonly missionPriority = input.required<Priority>();
  readonly missionRequiredUavType = input.required<UAVType>();
  readonly uavTypeByTailId = input.required<Record<number, UAVType>>();
  readonly insight = input<AssignmentPairingInsight | null>(null);
  readonly isExpanded = signal(false);

  readonly showOnMap = output<string>();

  readonly title = AssignmentPageConstants.ALGORITHM_PANEL_TITLE;
  readonly stepMissionNeedsLabel = AssignmentPageConstants.ALGORITHM_STEP_MISSION_NEEDS_LABEL;
  readonly stepCandidatesLabel = AssignmentPageConstants.ALGORITHM_STEP_CANDIDATES_LABEL;
  readonly stepDecisionLabel = AssignmentPageConstants.ALGORITHM_STEP_DECISION_LABEL;
  readonly stepSelectionChangeLabel = AssignmentPageConstants.ALGORITHM_STEP_SELECTION_CHANGE_LABEL;
  readonly technicalDetailsLabel = AssignmentPageConstants.ALGORITHM_TECHNICAL_DETAILS_LABEL;
  readonly alternativesLabel = AssignmentPageConstants.ALGORITHM_VALID_CANDIDATES_LABEL;
  readonly alternativesEmpty = AssignmentPageConstants.ALGORITHM_ALTERNATIVES_EMPTY;
  readonly blockedCandidatesLabel = AssignmentPageConstants.ALGORITHM_BLOCKED_CANDIDATES_LABEL;
  readonly blockedCandidatesEmptyLabel = AssignmentPageConstants.ALGORITHM_BLOCKED_CANDIDATES_EMPTY_LABEL;
  readonly showOnMapLabel = AssignmentPageConstants.SHOW_ON_MAP_LABEL;
  readonly candidateBestFitLabel = AssignmentPageConstants.ALGORITHM_CANDIDATE_BEST_FIT_LABEL;
  readonly candidateSuggestedLabel = AssignmentPageConstants.ALGORITHM_CANDIDATE_SUGGESTED_LABEL;
  readonly candidateWeakerLabel = AssignmentPageConstants.ALGORITHM_CANDIDATE_WEAKER_LABEL;
  readonly decisionBestScoreLabel = AssignmentPageConstants.ALGORITHM_DECISION_BEST_SCORE_LABEL;
  readonly decisionBlockedAvoidedLabel = AssignmentPageConstants.ALGORITHM_DECISION_BLOCKED_AVOIDED_LABEL;
  readonly reasonDistanceLabel = AssignmentPageConstants.ALGORITHM_DECISION_DISTANCE_LABEL;
  readonly reasonTelemetryLabel = AssignmentPageConstants.ALGORITHM_DECISION_TELEMETRY_LABEL;
  readonly reasonPriorityLabel = AssignmentPageConstants.ALGORITHM_DECISION_PRIORITY_LABEL;
  readonly reasonSafetyLabel = AssignmentPageConstants.ALGORITHM_DECISION_SAFETY_LABEL;
  readonly blockedReasonTypeMismatchLabel =
    AssignmentPageConstants.ALGORITHM_BLOCKED_REASON_TYPE_MISMATCH_LABEL;
  readonly blockedReasonActiveMissionLabel =
    AssignmentPageConstants.ALGORITHM_BLOCKED_REASON_ACTIVE_MISSION_LABEL;
  readonly blockedReasonLowerScoreLabel = AssignmentPageConstants.ALGORITHM_BLOCKED_REASON_LOWER_SCORE_LABEL;
  readonly blockedReasonConflictRiskLabel =
    AssignmentPageConstants.ALGORITHM_BLOCKED_REASON_CONFLICT_RISK_LABEL;
  readonly selectionNoChangeLabel = AssignmentPageConstants.ALGORITHM_SELECTION_NO_CHANGE_LABEL;
  readonly selectionImprovedLabel = AssignmentPageConstants.ALGORITHM_SELECTION_IMPROVED_LABEL;
  readonly selectionWorseLabel = AssignmentPageConstants.ALGORITHM_SELECTION_WORSE_LABEL;
  readonly selectionUnknownLabel = AssignmentPageConstants.ALGORITHM_SELECTION_UNKNOWN_LABEL;
  readonly warningTypeMismatchLabel = AssignmentPageConstants.ALGORITHM_WARNING_TYPE_MISMATCH_LABEL;
  readonly warningActiveMissionLabel = AssignmentPageConstants.ALGORITHM_WARNING_ACTIVE_MISSION_LABEL;
  readonly warningConflictRiskLabel = AssignmentPageConstants.ALGORITHM_WARNING_CONFLICT_RISK_LABEL;
  readonly warningPrefixLabel = AssignmentPageConstants.ALGORITHM_WARNING_PREFIX_LABEL;
  readonly missionNeedsSentenceLabel = AssignmentPageConstants.ALGORITHM_MISSION_NEEDS_SENTENCE_LABEL;
  readonly selectedLabel = AssignmentPageConstants.ALGORITHM_SELECTED_LABEL;
  readonly suggestedLabel = AssignmentPageConstants.ALGORITHM_SUGGESTED_LABEL;
  readonly deltaLabel = AssignmentPageConstants.SCORE_DELTA_LABEL;
  readonly topReasonsLimit = AssignmentPageConstants.ALGORITHM_TOP_REASONS_LIMIT;
  readonly candidateSummariesLimit = AssignmentPageConstants.ALGORITHM_CANDIDATE_SUMMARIES_LIMIT;
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

  readonly blockedAlternatives = computed<AssignmentPairingAlternative[]>(() => {
    const insight = this.insight();
    if (!insight) {
      return [];
    }

    const requiredUavType = this.missionRequiredUavType();
    const uavTypes = this.uavTypeByTailId();

    return insight.alternatives.filter((alternative) => {
      const isTypeMismatch = uavTypes[alternative.tailId] !== requiredUavType;
      const hasActiveMissionPenalty = alternative.activeMissionPenalty < NO_PENALTY;
      return isTypeMismatch || hasActiveMissionPenalty;
    });
  });

  readonly missionNeedsSummary = computed<string>(() => {
    const missionType = EnumUtil.getUAVTypeDisplay(this.missionRequiredUavType());
    const missionPriority = EnumUtil.getPriorityDisplay(this.missionPriority());
    return this.missionNeedsSentenceLabel
      .replace('{type}', missionType)
      .replace('{priority}', missionPriority);
  });

  readonly candidateSummaries = computed<string[]>(() => {
    const insight = this.insight();
    if (!insight) {
      return [];
    }

    const alternatives = this.rankedAlternatives().slice(0, this.candidateSummariesLimit);
    const summaries = [
      `UAV-${insight.suggestedTailId}: ${this.candidateBestFitLabel}`,
    ];

    for (const alternative of alternatives) {
      const delta = alternative.totalScore - insight.totalScore;
      const relativeLabel =
        delta === NO_SCORE
          ? this.candidateSuggestedLabel
          : `${this.candidateWeakerLabel} ${this.withSign(delta)}`;
      summaries.push(`UAV-${alternative.tailId}: ${relativeLabel}`);
    }

    return summaries;
  });

  readonly blockedCandidateSummaries = computed<string[]>(() => {
    const insight = this.insight();
    if (!insight) {
      return [];
    }

    return this.blockedAlternatives()
      .slice(0, this.candidateSummariesLimit)
      .map((alternative) => {
        const reason = this.resolveBlockedReason(alternative, insight.totalScore);
        return `UAV-${alternative.tailId}: ${reason}`;
      });
  });

  readonly decisionReasons = computed<string[]>(() => {
    const insight = this.insight();
    if (!insight) {
      return [];
    }

    const reasonBuckets = [
      { value: insight.distanceScore, label: this.reasonDistanceLabel },
      { value: insight.telemetryScore, label: this.reasonTelemetryLabel },
      { value: insight.priorityScore, label: this.reasonPriorityLabel },
      {
        value:
          insight.typeMismatchPenalty === NO_PENALTY && insight.activeMissionPenalty === NO_PENALTY
            ? CONFLICT_RISK_REASON_SCORE
            : NO_SCORE,
        label: this.reasonSafetyLabel,
      },
    ]
      .filter((bucket) => bucket.value > NO_SCORE)
      .sort((first, second) => second.value - first.value)
      .slice(0, this.topReasonsLimit - 1)
      .map((bucket) => bucket.label);

    const reasons = [this.decisionBestScoreLabel];
    if (this.blockedAlternatives().length > 0) {
      reasons.push(this.decisionBlockedAvoidedLabel);
    }
    reasons.push(...reasonBuckets);
    return reasons.slice(0, this.topReasonsLimit);
  });

  readonly selectedChangeSummary = computed<string>(() => {
    const delta = this.deltaVsSuggestion();
    if (delta === null) {
      return this.selectionUnknownLabel;
    }
    if (delta === NO_SCORE) {
      return this.selectionNoChangeLabel;
    }
    if (delta > NO_SCORE) {
      return `${this.selectionImprovedLabel} ${this.withSign(delta)}`;
    }
    return `${this.selectionWorseLabel} ${this.withSign(delta)}`;
  });

  readonly selectedWarnings = computed<string[]>(() => {
    const insight = this.insight();
    if (!insight) {
      return [];
    }

    const selectedTailId = this.selectedTailId();
    if (selectedTailId === insight.suggestedTailId) {
      return [];
    }

    const selectedAlternative = insight.alternatives.find((alternative) => alternative.tailId === selectedTailId);
    if (!selectedAlternative) {
      return [this.warningConflictRiskLabel];
    }

    const warnings: string[] = [];
    if (selectedAlternative.typeMismatchPenalty < NO_PENALTY) {
      warnings.push(this.warningTypeMismatchLabel);
    }
    if (selectedAlternative.activeMissionPenalty < NO_PENALTY) {
      warnings.push(this.warningActiveMissionLabel);
    }

    return warnings;
  });

  onShowOnMap(): void {
    this.showOnMap.emit(this.missionId());
  }

  togglePanel(): void {
    this.isExpanded.update((expanded) => !expanded);
  }

  withSign(value: number | null): string {
    if (value === null) {
      return 'N/A';
    }
    return `${value > 0 ? '+' : ''}${value.toFixed(this.decimals)}`;
  }

  private resolveBlockedReason(alternative: AssignmentPairingAlternative, suggestedScore: number): string {
    const requiredUavType = this.missionRequiredUavType();
    const uavTypes = this.uavTypeByTailId();
    const isTypeMismatch = uavTypes[alternative.tailId] !== requiredUavType;
    if (isTypeMismatch || alternative.typeMismatchPenalty < NO_PENALTY) {
      return this.blockedReasonTypeMismatchLabel;
    }
    if (alternative.activeMissionPenalty < NO_PENALTY) {
      return this.blockedReasonActiveMissionLabel;
    }
    if (alternative.totalScore < suggestedScore) {
      return `${this.blockedReasonLowerScoreLabel} ${this.withSign(alternative.totalScore - suggestedScore)}`;
    }
    return this.blockedReasonConflictRiskLabel;
  }
}
