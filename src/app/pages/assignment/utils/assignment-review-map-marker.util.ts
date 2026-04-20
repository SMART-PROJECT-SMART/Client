import * as L from 'leaflet';
import { UAVType } from '../../../common/enums';
import { ClientConstants } from '../../../common/constants/clientConstants.constant';
import type { CreateUavDivIconOptions } from './assignment-review-map.types';

const MAP = ClientConstants.AssignmentReviewMap;

function createGlyphHtml(
  glyphClass: string,
  assetUrl: string,
): string {
  return `<div class="${glyphClass}" style="--ar-map-glyph-size:${MAP.GLYPH_SIZE_PX}px;--ar-map-mask-url:url('${assetUrl}')"></div>`;
}

export function createUavDivIcon(
  accentColor: string,
  options: CreateUavDivIconOptions = {},
): L.DivIcon {
  const color = accentColor || MAP.DEFAULT_UAV_ACCENT;
  const activeIndicator = options.isOnActiveMission
    ? `<span class="ar-map-uav-active-indicator" aria-label="Active mission"></span>`
    : '';
  const html = `<div class="${MAP.UAV_ICON_CLASS}" style="--ar-uav-accent:${color}">
    ${createGlyphHtml(`${MAP.GLYPH_CLASS} ${MAP.GLYPH_UAV_CLASS}`, MAP.UAV_ICON_ASSET_URL)}
    ${activeIndicator}
  </div>`;
  const w = MAP.UAV_ICON_WIDTH_PX;
  const h = MAP.UAV_ICON_HEIGHT_PX;
  return L.divIcon({
    html,
    className: MAP.ICON_WRAPPER_CLASS,
    iconSize: [w, h],
    iconAnchor: [Math.floor(w / 2), h],
    popupAnchor: [0, -h],
  });
}

export function createMissionDivIcon(
  missionType: UAVType,
  accentColor: string,
  priorityOutlineColor: string,
): L.DivIcon {
  const color = accentColor || MAP.DEFAULT_MISSION_ACCENT;
  const missionOutlineColor = priorityOutlineColor || MAP.PRIORITY_OUTLINE_DEFAULT_COLOR;
  const missionGlyphClass =
    missionType === UAVType.Armed
      ? MAP.GLYPH_MISSION_ARMED_CLASS
      : MAP.GLYPH_MISSION_SURVEILLANCE_CLASS;
  const missionAssetUrl =
    missionType === UAVType.Armed
      ? MAP.MISSION_ARMED_ICON_ASSET_URL
      : MAP.MISSION_SURVEILLANCE_ICON_ASSET_URL;
  const html = `<div class="${MAP.MISSION_ICON_CLASS}" style="--ar-mission-accent:${color};--ar-mission-priority-outline:${missionOutlineColor};--ar-mission-priority-outline-width:${MAP.MISSION_PRIORITY_OUTLINE_WIDTH_PX}px">${createGlyphHtml(
    `${MAP.GLYPH_CLASS} ${missionGlyphClass}`,
    missionAssetUrl,
  )}</div>`;
  const w = MAP.MISSION_ICON_WIDTH_PX;
  const h = MAP.MISSION_ICON_HEIGHT_PX;
  return L.divIcon({
    html,
    className: MAP.ICON_WRAPPER_CLASS,
    iconSize: [w, h],
    iconAnchor: [Math.floor(w / 2), h],
    popupAnchor: [0, -h],
  });
}
