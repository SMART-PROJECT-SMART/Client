import type { AssignmentReviewMapHighlightContext } from '../../../models/assignment/assignmentReviewMapHighlightContext.model';

export function hasAnyMapHighlightSelection(ctx: AssignmentReviewMapHighlightContext): boolean {
  return (
    ctx.highlightMissionIds.size > 0 ||
    ctx.highlightMissionTypes.size > 0 ||
    ctx.highlightUavTypes.size > 0 ||
    ctx.highlightTailIds.size > 0
  );
}

export function resolveMissionHighlightOpacity(
  ctx: AssignmentReviewMapHighlightContext,
  missionId: string,
  fullOpacity: number,
  dimmedOpacity: number,
): number {
  if (!hasAnyMapHighlightSelection(ctx)) {
    return fullOpacity;
  }

  if (ctx.focusedMissionId && ctx.highlightMissionIds.size > 0) {
    return ctx.highlightMissionIds.has(missionId) ? fullOpacity : dimmedOpacity;
  }

  if (ctx.highlightMissionIds.has(missionId)) {
    return fullOpacity;
  }
  const pairing = ctx.pairings.find((p) => p.mission.id === missionId);
  if (!pairing) {
    return dimmedOpacity;
  }
  if (ctx.highlightMissionTypes.has(pairing.mission.requiredUAVType)) {
    return fullOpacity;
  }
  if (ctx.highlightTailIds.size > 0) {
    const assigned =
      ctx.selectedTailIdsByMissionId.get(missionId) ?? pairing.tailId;
    if (ctx.highlightTailIds.has(assigned)) {
      return fullOpacity;
    }
  }
  if (ctx.highlightUavTypes.size > 0) {
    const assigned =
      ctx.selectedTailIdsByMissionId.get(missionId) ?? pairing.tailId;
    const assignedType = ctx.uavTypeByTailId[assigned];
    if (assignedType && ctx.highlightUavTypes.has(assignedType)) {
      return fullOpacity;
    }
  }
  return dimmedOpacity;
}

export function resolveUavHighlightOpacity(
  ctx: AssignmentReviewMapHighlightContext,
  tailId: number,
  fullOpacity: number,
  dimmedOpacity: number,
): number {
  if (!hasAnyMapHighlightSelection(ctx)) {
    return fullOpacity;
  }
  if (ctx.highlightTailIds.has(tailId)) {
    return fullOpacity;
  }
  const uavType = ctx.uavTypeByTailId[tailId];
  if (uavType && ctx.highlightUavTypes.has(uavType)) {
    return fullOpacity;
  }
  if (isTailAssignedToHighlightedMission(ctx, tailId)) {
    return fullOpacity;
  }
  if (isTailAssignedToHighlightedMissionType(ctx, tailId)) {
    return fullOpacity;
  }
  return dimmedOpacity;
}

export function resolveDimmedConnectorLineOpacity(
  missionOpacity: number,
  uavOpacity: number,
  ctx: AssignmentReviewMapHighlightContext,
  fullOpacity: number,
  dimmedOpacity: number,
  normalLineOpacity: number,
): number {
  if (
    hasAnyMapHighlightSelection(ctx) &&
    (missionOpacity < fullOpacity || uavOpacity < fullOpacity)
  ) {
    return dimmedOpacity;
  }
  return normalLineOpacity;
}

function isTailAssignedToHighlightedMission(
  ctx: AssignmentReviewMapHighlightContext,
  tailId: number,
): boolean {
  if (ctx.highlightMissionIds.size === 0) {
    return false;
  }
  for (const p of ctx.pairings) {
    const assigned = ctx.selectedTailIdsByMissionId.get(p.mission.id) ?? p.tailId;
    if (assigned === tailId && ctx.highlightMissionIds.has(p.mission.id)) {
      return true;
    }
  }
  return false;
}

function isTailAssignedToHighlightedMissionType(
  ctx: AssignmentReviewMapHighlightContext,
  tailId: number,
): boolean {
  if (ctx.highlightMissionTypes.size === 0) {
    return false;
  }
  for (const p of ctx.pairings) {
    const assigned = ctx.selectedTailIdsByMissionId.get(p.mission.id) ?? p.tailId;
    if (assigned === tailId && ctx.highlightMissionTypes.has(p.mission.requiredUAVType)) {
      return true;
    }
  }
  return false;
}
