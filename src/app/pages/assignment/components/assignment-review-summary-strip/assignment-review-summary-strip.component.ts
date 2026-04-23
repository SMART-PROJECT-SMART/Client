import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ClientConstants } from '../../../../common';
import type { AssignmentPairingInsight } from '../../../../models/assignment/assignmentPairingInsight.model';

const { AssignmentPageConstants } = ClientConstants;
type ReasonKey = 'distance' | 'telemetry' | 'safety';

@Component({
  selector: 'app-assignment-review-summary-strip',
  standalone: false,
  templateUrl: './assignment-review-summary-strip.component.html',
  styleUrl: './assignment-review-summary-strip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentReviewSummaryStripComponent {
  readonly fitnessScore = input.required<number>();
  readonly pairingInsights = input.required<AssignmentPairingInsight[]>();
  readonly hasViolations = input.required<boolean>();

  readonly summaryTitle = AssignmentPageConstants.ALGORITHM_SUMMARY_TITLE;
  readonly scoreLabel = AssignmentPageConstants.FITNESS_SCORE_LABEL;
  readonly scoreHintLabel = AssignmentPageConstants.FITNESS_SCORE_HINT_LABEL;
  readonly whyScoreTitle = AssignmentPageConstants.ALGORITHM_WHY_SCORE_TITLE;
  readonly formulaLabel = AssignmentPageConstants.ALGORITHM_FORMULA_LABEL;
  readonly reasonDistanceLabel = AssignmentPageConstants.ALGORITHM_REASON_DISTANCE_LABEL;
  readonly reasonTelemetryLabel = AssignmentPageConstants.ALGORITHM_REASON_TELEMETRY_LABEL;
  readonly reasonSafetyLabel = AssignmentPageConstants.ALGORITHM_REASON_SAFETY_LABEL;
  readonly reasonMissionSuffix = AssignmentPageConstants.ALGORITHM_REASON_MISSION_SUFFIX;
  readonly glossaryTitle = AssignmentPageConstants.ALGORITHM_GLOSSARY_TITLE;
  readonly glossaryTelemetry = AssignmentPageConstants.ALGORITHM_GLOSSARY_TELEMETRY;
  readonly glossaryDistance = AssignmentPageConstants.ALGORITHM_GLOSSARY_DISTANCE;
  readonly glossaryPriority = AssignmentPageConstants.ALGORITHM_GLOSSARY_PRIORITY;
  readonly glossaryPenalties = AssignmentPageConstants.ALGORITHM_GLOSSARY_PENALTIES;
  readonly glossaryBonuses = AssignmentPageConstants.ALGORITHM_GLOSSARY_BONUSES;
  readonly strongMarginThreshold = AssignmentPageConstants.ALGORITHM_STRONG_MARGIN_THRESHOLD;

  readonly reasonCounts = computed<Record<ReasonKey, number>>(() => {
    const counts: Record<ReasonKey, number> = { distance: 0, telemetry: 0, safety: 0 };
    for (const insight of this.pairingInsights()) {
      const reason = this.resolvePrimaryReason(insight);
      if (reason) {
        counts[reason] += 1;
      }
    }
    return counts;
  });

  reasonCount(key: ReasonKey): number {
    return this.reasonCounts()[key];
  }

  private resolveMarginAgainstRunnerUp(insight: AssignmentPairingInsight): number {
    const runnerUpScore = insight.alternatives.length > 0
      ? Math.max(...insight.alternatives.map((alt) => alt.totalScore))
      : 0;
    return insight.totalScore - runnerUpScore;
  }

  private resolvePrimaryReason(insight: AssignmentPairingInsight): ReasonKey | null {
    if (insight.alternatives.length === 0) {
      return null;
    }
    const runnerUp = insight.alternatives.reduce((best, current) =>
      current.totalScore > best.totalScore ? current : best,
    );
    const distanceAdvantage = insight.distanceScore - runnerUp.distanceScore;
    const telemetryAdvantage = insight.telemetryScore - runnerUp.telemetryScore;
    const safetyAdvantage =
      (insight.activeMissionPenalty + insight.typeMismatchPenalty)
      - (runnerUp.activeMissionPenalty + runnerUp.typeMismatchPenalty);
    const candidates: Array<{ key: ReasonKey; value: number }> = [
      { key: 'distance', value: distanceAdvantage },
      { key: 'telemetry', value: telemetryAdvantage },
      { key: 'safety', value: safetyAdvantage },
    ];
    candidates.sort((a, b) => b.value - a.value);
    return candidates[0].key;
  }
}
