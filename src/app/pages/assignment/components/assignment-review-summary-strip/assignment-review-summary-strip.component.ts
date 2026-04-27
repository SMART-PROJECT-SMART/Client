import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ClientConstants } from '../../../../common';
import type { AssignmentExplanationReasonCandidate } from '../../../../models/assignment/assignmentExplanationReasonCandidate.model';
import type { AssignmentExplanationReasonKey } from '../../../../models/assignment/assignmentExplanationReasonKey.model';
import type { AssignmentPairingInsight } from '../../../../models/assignment/assignmentPairingInsight.model';

const { AssignmentPageConstants } = ClientConstants;

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
  readonly displayedRelativeScore = computed<number>(() =>
    this.fitnessScore() > AssignmentPageConstants.RELATIVE_SCORE_MIN
      ? AssignmentPageConstants.RELATIVE_SCORE_MAX
      : AssignmentPageConstants.RELATIVE_SCORE_MIN,
  );

  readonly labels = AssignmentPageConstants.ASSIGNMENT_SUMMARY_STRIP_LABELS;

  readonly reasonCounts = computed<Record<AssignmentExplanationReasonKey, number>>(() => {
    const counts: Record<AssignmentExplanationReasonKey, number> = { distance: 0, telemetry: 0, safety: 0 };
    for (const insight of this.pairingInsights()) {
      const reason = this.resolvePrimaryReason(insight);
      if (reason) {
        counts[reason] += 1;
      }
    }
    return counts;
  });

  reasonCount(key: AssignmentExplanationReasonKey): number {
    return this.reasonCounts()[key];
  }

  private resolvePrimaryReason(insight: AssignmentPairingInsight): AssignmentExplanationReasonKey | null {
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
    const candidates: AssignmentExplanationReasonCandidate[] = [
      { key: 'distance', value: distanceAdvantage },
      { key: 'telemetry', value: telemetryAdvantage },
      { key: 'safety', value: safetyAdvantage },
    ];
    candidates.sort((a, b) => b.value - a.value);
    return candidates[0].key;
  }
}
