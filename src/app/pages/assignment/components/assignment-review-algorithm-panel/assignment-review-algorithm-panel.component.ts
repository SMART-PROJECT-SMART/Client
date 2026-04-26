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
  public readonly missionId = input.required<string>();
  public readonly suggestedTailId = input.required<number>();
  public readonly selectedTailId = input.required<number>();
  public readonly missionPriority = input.required<Priority>();
  public readonly missionRequiredUavType = input.required<UAVType>();
  public readonly uavTypeByTailId = input.required<Record<number, UAVType>>();
  public readonly insight = input<AssignmentPairingInsight | null>(null);
  public readonly isExpanded = signal(false);

  public readonly showOnMap = output<string>();

  public readonly labels = AssignmentPageConstants.ASSIGNMENT_EXPLANATION_LABELS;
  public readonly limits = AssignmentPageConstants.ASSIGNMENT_EXPLANATION_LIMITS;

  public readonly selectedScore = computed<number | null>(() => {
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

  public readonly deltaVsSuggestion = computed<number | null>(() => {
    const selected = this.selectedScore();
    const insight = this.insight();
    if (selected === null || !insight) {
      return null;
    }
    return selected - insight.totalScore;
  });

  public readonly rankedAlternatives = computed<AssignmentPairingAlternative[]>(() => {
    const requiredUavType = this.missionRequiredUavType();
    const uavTypes = this.uavTypeByTailId();

    return (
      this.insight()?.alternatives.filter((alternative) => uavTypes[alternative.tailId] === requiredUavType)
      ?? []
    );
  });

  public readonly blockedAlternatives = computed<AssignmentPairingAlternative[]>(() => {
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

  public readonly missionNeedsSummary = computed<string>(() => {
    const missionType = EnumUtil.getUAVTypeDisplay(this.missionRequiredUavType());
    const missionPriority = EnumUtil.getPriorityDisplay(this.missionPriority());
    return this.labels.missionNeedsSentence
      .replace('{type}', missionType)
      .replace('{priority}', missionPriority);
  });

  public readonly candidateSummaries = computed<string[]>(() => {
    const insight = this.insight();
    if (!insight) {
      return [];
    }

    const alternatives = this.rankedAlternatives().slice(0, this.limits.candidateSummaries);
    const summaries = [
      `UAV-${insight.suggestedTailId}: ${this.labels.candidateBestFit}`,
    ];

    for (const alternative of alternatives) {
      const delta = alternative.totalScore - insight.totalScore;
      const relativeLabel =
        delta === NO_SCORE
          ? this.labels.candidateSuggested
          : `${this.labels.candidateWeaker} ${this.withSign(delta)}`;
      summaries.push(`UAV-${alternative.tailId}: ${relativeLabel}`);
    }

    return summaries;
  });

  public readonly blockedCandidateSummaries = computed<string[]>(() => {
    const insight = this.insight();
    if (!insight) {
      return [];
    }

    return this.blockedAlternatives()
      .slice(0, this.limits.candidateSummaries)
      .map((alternative) => {
        const reason = this.resolveBlockedReason(alternative, insight.totalScore);
        return `UAV-${alternative.tailId}: ${reason}`;
      });
  });

  public readonly decisionReasons = computed<string[]>(() => {
    const insight = this.insight();
    if (!insight) {
      return [];
    }

    const reasonBuckets = [
      { value: insight.distanceScore, label: this.labels.reasonDistance },
      { value: insight.telemetryScore, label: this.labels.reasonTelemetry },
      { value: insight.priorityScore, label: this.labels.reasonPriority },
      {
        value:
          insight.typeMismatchPenalty === NO_PENALTY && insight.activeMissionPenalty === NO_PENALTY
            ? CONFLICT_RISK_REASON_SCORE
            : NO_SCORE,
        label: this.labels.reasonSafety,
      },
    ]
      .filter((bucket) => bucket.value > NO_SCORE)
      .sort((first, second) => second.value - first.value)
      .slice(0, this.limits.topReasons - 1)
      .map((bucket) => bucket.label);

    const reasons = [this.labels.decisionBestScore];
    reasons.push(...reasonBuckets);
    return reasons.slice(0, this.limits.topReasons);
  });

  public readonly selectedChangeSummary = computed<string>(() => {
    const delta = this.deltaVsSuggestion();
    if (delta === null) {
      return this.labels.selectionUnknown;
    }
    if (delta === NO_SCORE) {
      return this.labels.selectionNoChange;
    }
    if (delta > NO_SCORE) {
      return `${this.labels.selectionImproved} ${this.withSign(delta)}`;
    }
    return `${this.labels.selectionWorse} ${this.withSign(delta)}`;
  });

  public readonly selectedWarnings = computed<string[]>(() => {
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
      return [this.labels.warningConflictRisk];
    }

    const warnings: string[] = [];
    if (selectedAlternative.typeMismatchPenalty < NO_PENALTY) {
      warnings.push(this.labels.warningTypeMismatch);
    }
    if (selectedAlternative.activeMissionPenalty < NO_PENALTY) {
      warnings.push(this.labels.warningActiveMission);
    }

    return warnings;
  });

  public onShowOnMap(): void {
    this.showOnMap.emit(this.missionId());
  }

  public togglePanel(): void {
    this.isExpanded.update((expanded) => !expanded);
  }

  public withSign(value: number | null): string {
    if (value === null) {
      return 'N/A';
    }
    return `${value > 0 ? '+' : ''}${value.toFixed(this.limits.decimals)}`;
  }

  private resolveBlockedReason(alternative: AssignmentPairingAlternative, suggestedScore: number): string {
    const requiredUavType = this.missionRequiredUavType();
    const uavTypes = this.uavTypeByTailId();
    const isTypeMismatch = uavTypes[alternative.tailId] !== requiredUavType;
    if (isTypeMismatch || alternative.typeMismatchPenalty < NO_PENALTY) {
      return this.labels.blockedReasonTypeMismatch;
    }
    if (alternative.activeMissionPenalty < NO_PENALTY) {
      return this.labels.blockedReasonActiveMission;
    }
    if (alternative.totalScore < suggestedScore) {
      return `${this.labels.blockedReasonLowerScore} ${this.withSign(alternative.totalScore - suggestedScore)}`;
    }
    return this.labels.blockedReasonConflictRisk;
  }
}
