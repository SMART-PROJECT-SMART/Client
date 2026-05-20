import { ClientConstants } from '../../../common';

const { AssignmentPageConstants } = ClientConstants;

export function resolveRelativeScore(
  suggestedTotalScore: number | null | undefined,
  candidateTotalScore: number | null | undefined,
): number {
  if (
    suggestedTotalScore === null
    || suggestedTotalScore === undefined
    || candidateTotalScore === null
    || candidateTotalScore === undefined
  ) {
    return 0;
  }

  if (!Number.isFinite(suggestedTotalScore) || !Number.isFinite(candidateTotalScore)) {
    return 0;
  }

  if (suggestedTotalScore <= 0) {
    return 0;
  }

  const rawRelativeScore =
    (candidateTotalScore / suggestedTotalScore) * AssignmentPageConstants.RELATIVE_SCORE_MAX;
  const clampedScore = Math.min(
    AssignmentPageConstants.RELATIVE_SCORE_MAX,
    Math.max(AssignmentPageConstants.RELATIVE_SCORE_MIN, rawRelativeScore),
  );

  return Number(clampedScore.toFixed(AssignmentPageConstants.SCORE_DECIMALS));
}

