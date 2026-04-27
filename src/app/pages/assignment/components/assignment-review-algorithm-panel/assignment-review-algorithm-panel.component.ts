import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Priority, UAVType } from '../../../../common/enums';
import { ClientConstants } from '../../../../common';
import { EnumUtil } from '../../../../common/utils';
import type { AssignmentPairingAlternative } from '../../../../models/assignment/assignmentPairingAlternative.model';
import type { AssignmentPairingInsight } from '../../../../models/assignment/assignmentPairingInsight.model';
import { resolveRelativeScore } from '../../utils/assignment-relative-score.util';

const { AssignmentPageConstants } = ClientConstants;
const NO_PENALTY = 0;

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
  public readonly activeMissionTailIds = input<Set<number>>(new Set());
  public readonly insight = input<AssignmentPairingInsight | null>(null);
  public readonly isExpanded = signal(false);

  public readonly showOnMap = output<string>();

  public readonly labels = AssignmentPageConstants.ASSIGNMENT_EXPLANATION_LABELS;
  public readonly limits = AssignmentPageConstants.ASSIGNMENT_EXPLANATION_LIMITS;
  public readonly stepDecisionLabel = computed<string>(() => {
    const insight = this.insight();
    if (!insight) {
      return this.labels.stepDecision;
    }
    return this.labels.stepDecision.replace('{tailId}', String(insight.suggestedTailId));
  });

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

  public readonly suggestedRelativeScore = computed<number | null>(() => {
    const insight = this.insight();
    if (!insight) {
      return null;
    }
    return AssignmentPageConstants.RELATIVE_SCORE_MAX;
  });

  public readonly selectedRelativeScore = computed<number | null>(() => {
    const selected = this.selectedScore();
    const insight = this.insight();
    if (selected === null || !insight) {
      return null;
    }
    return resolveRelativeScore(insight.totalScore, selected);
  });

  public readonly rankedAlternatives = computed<AssignmentPairingAlternative[]>(() => {
    const requiredUavType = this.missionRequiredUavType();
    const uavTypes = this.uavTypeByTailId();

    return (
      this.insight()?.alternatives.filter((alternative) => {
        const isTypeMatch = uavTypes[alternative.tailId] === requiredUavType;
        const isNotActiveMissionPenalized = alternative.activeMissionPenalty >= NO_PENALTY;
        return isTypeMatch && isNotActiveMissionPenalized;
      })
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
      const relativeScore = resolveRelativeScore(insight.totalScore, alternative.totalScore);
      const relativeLabel = `${this.labels.candidateRelativeScore} ${this.withPercent(relativeScore)}`;
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

    const bestScoreReason = this.labels.decisionBestScore;
    const activeMissionStatusReason = (
      this.activeMissionTailIds().has(insight.suggestedTailId)
        ? this.labels.reasonActiveMissionNegative
        : this.labels.reasonNotInActiveMission
    );

    const reasonBuckets = [
      { value: insight.distanceScore, label: this.labels.reasonDistance },
      { value: insight.telemetryScore, label: this.labels.reasonTelemetry },
      { value: insight.priorityScore, label: this.labels.reasonPriority },
    ]
      .filter((bucket) => bucket.value > 0)
      .sort((first, second) => second.value - first.value)
      .slice(0, this.limits.topReasons - 1)
      .map((bucket) => bucket.label);

    const reasons = [bestScoreReason, activeMissionStatusReason];
    reasons.push(...reasonBuckets);
    return reasons.slice(0, this.limits.topReasons + 1);
  });

  public readonly selectedChangeSummary = computed<string>(() => {
    const relativeScore = this.selectedRelativeScore();
    if (relativeScore === null) {
      return this.labels.selectionUnknown;
    }
    return `${this.labels.selectionRelativeScore} ${this.withPercent(relativeScore)}`;
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

  public withPercent(value: number | null): string {
    if (value === null) {
      return 'N/A';
    }
    return `${value.toFixed(this.limits.decimals)}${this.labels.relativeScoreSuffix}`;
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
      const relativeScore = resolveRelativeScore(suggestedScore, alternative.totalScore);
      return `${this.labels.blockedReasonLowerScore} ${this.withPercent(relativeScore)}`;
    }
    return this.labels.blockedReasonConflictRisk;
  }
}
