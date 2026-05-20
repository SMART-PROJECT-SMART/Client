export function buildMapUavPlacementKey(tailId: number): string {
  return `uav-${tailId}`;
}

export function buildMapMissionPlacementKey(missionId: string): string {
  return `mission-${missionId}`;
}
