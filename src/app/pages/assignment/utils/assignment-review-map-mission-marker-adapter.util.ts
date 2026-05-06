import { UAVType } from '../../../common/enums/uavType.enum';
import { ClientConstants } from '../../../common/constants/clientConstants.constant';
import type { CreateMissionDivIconOptions } from '../../../models/assignment/createMissionDivIconOptions.model';
import type { MissionMarkerIconAdapter } from '../../../models/assignment/missionMarkerIconAdapter.model';

const MAP = ClientConstants.AssignmentReviewMap;

export function buildMissionMarkerIconAdapter(
  missionType: UAVType,
  accentColor: string,
  priorityOutlineColor: string,
  options: CreateMissionDivIconOptions = {},
): MissionMarkerIconAdapter {
  return {
    opacity: options.opacity ?? MAP.FILTER_FULL_OPACITY,
    glyphClass: resolveMissionGlyphClass(missionType),
    assetUrl: resolveMissionAssetUrl(missionType),
    cssVariableStyle: [
      `--ar-mission-accent:${accentColor || MAP.DEFAULT_MISSION_ACCENT}`,
      `--ar-mission-priority-outline:${priorityOutlineColor || MAP.PRIORITY_OUTLINE_DEFAULT_COLOR}`,
      `--ar-mission-priority-outline-width:${MAP.MISSION_PRIORITY_OUTLINE_WIDTH_PX}px`,
    ].join(';'),
  };
}

function resolveMissionGlyphClass(missionType: UAVType): string {
  return missionType === UAVType.Armed
    ? `${MAP.GLYPH_CLASS} ${MAP.GLYPH_MISSION_ARMED_CLASS}`
    : `${MAP.GLYPH_CLASS} ${MAP.GLYPH_MISSION_SURVEILLANCE_CLASS}`;
}

function resolveMissionAssetUrl(missionType: UAVType): string {
  return missionType === UAVType.Armed
    ? MAP.MISSION_ARMED_ICON_ASSET_URL
    : MAP.MISSION_SURVEILLANCE_ICON_ASSET_URL;
}
