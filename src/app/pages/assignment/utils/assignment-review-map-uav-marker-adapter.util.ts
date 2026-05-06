import { UAVType } from '../../../common/enums/uavType.enum';
import { ClientConstants } from '../../../common/constants/clientConstants.constant';
import type { CreateUavDivIconOptions } from '../../../models/assignment/createUavDivIconOptions.model';
import type { UavMarkerIconAdapter } from '../../../models/assignment/uavMarkerIconAdapter.model';

const MAP = ClientConstants.AssignmentReviewMap;

type ScoreBadgeColors = {
  backgroundColor: string;
  textColor: string;
};

export function buildUavMarkerIconAdapter(
  accentColor: string,
  options: CreateUavDivIconOptions = {},
): UavMarkerIconAdapter {
  const glyphClass = resolveUavGlyphClass(options.uavType);
  const assetUrl = resolveUavAssetUrl(options.uavType);
  const scoreBadgeColors = resolveScoreBadgeColors(options.relativeScoreBand);
  const styleVars = [
    `--ar-uav-accent:${accentColor || MAP.DEFAULT_UAV_ACCENT}`,
    `--ar-uav-active-mission-bg:${MAP.ACTIVE_MISSION_BADGE_BG_COLOR}`,
    `--ar-uav-active-mission-fg:${MAP.ACTIVE_MISSION_BADGE_TEXT_COLOR}`,
    `--ar-uav-active-mission-size:${MAP.ACTIVE_MISSION_BADGE_SIZE_PX}px`,
    `--ar-uav-active-mission-font-size:${MAP.ACTIVE_MISSION_BADGE_FONT_SIZE_PX}px`,
    `--ar-uav-score-bg:${scoreBadgeColors.backgroundColor}`,
    `--ar-uav-score-fg:${scoreBadgeColors.textColor}`,
    `--ar-uav-score-min-width:${MAP.UAV_SCORE_BADGE_MIN_WIDTH_PX}px`,
    `--ar-uav-score-height:${MAP.UAV_SCORE_BADGE_HEIGHT_PX}px`,
    `--ar-uav-score-font-size:${MAP.UAV_SCORE_BADGE_FONT_SIZE_PX}px`,
    `--ar-uav-score-top:${MAP.UAV_SCORE_BADGE_OFFSET_TOP_PX}px`,
    `--ar-uav-score-left:${MAP.UAV_SCORE_BADGE_OFFSET_LEFT_PX}px`,
  ].join(';');

  return {
    opacity: options.opacity ?? MAP.FILTER_FULL_OPACITY,
    glyphClass,
    assetUrl,
    activeIndicatorHtml: options.isOnActiveMission
      ? `<span class="ar-map-uav-active-indicator" aria-label="Active mission">${MAP.ACTIVE_MISSION_BADGE_TEXT}</span>`
      : '',
    relativeScoreBadgeHtml: options.relativeScoreText
      ? `<span class="ar-map-uav-score-badge" aria-label="${MAP.UAV_SCORE_BADGE_ARIA_LABEL}">${options.relativeScoreText}</span>`
      : '',
    cssVariableStyle: styleVars,
  };
}

function resolveUavGlyphClass(uavType: UAVType | undefined): string {
  return uavType === UAVType.Armed
    ? `${MAP.GLYPH_CLASS} ${MAP.GLYPH_UAV_CLASS} ${MAP.GLYPH_UAV_ARMED_CLASS}`
    : `${MAP.GLYPH_CLASS} ${MAP.GLYPH_UAV_CLASS} ${MAP.GLYPH_UAV_SURVEILLANCE_CLASS}`;
}

function resolveUavAssetUrl(uavType: UAVType | undefined): string {
  return uavType === UAVType.Armed
    ? MAP.UAV_ARMED_ICON_ASSET_URL
    : MAP.UAV_SURVEILLANCE_ICON_ASSET_URL;
}

function resolveScoreBadgeColors(relativeScoreBand: string | null | undefined): ScoreBadgeColors {
  if (relativeScoreBand === MAP.UAV_SCORE_BAND_HIGH) {
    return {
      backgroundColor: MAP.UAV_SCORE_BADGE_HIGH_BG_COLOR,
      textColor: MAP.UAV_SCORE_BADGE_HIGH_TEXT_COLOR,
    };
  }

  if (relativeScoreBand === MAP.UAV_SCORE_BAND_MEDIUM) {
    return {
      backgroundColor: MAP.UAV_SCORE_BADGE_MEDIUM_BG_COLOR,
      textColor: MAP.UAV_SCORE_BADGE_MEDIUM_TEXT_COLOR,
    };
  }

  return {
    backgroundColor: MAP.UAV_SCORE_BADGE_LOW_BG_COLOR,
    textColor: MAP.UAV_SCORE_BADGE_LOW_TEXT_COLOR,
  };
}
