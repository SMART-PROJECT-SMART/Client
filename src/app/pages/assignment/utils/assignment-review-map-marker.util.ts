import * as L from 'leaflet';
import { UAVType } from '../../../common/enums';
import { ClientConstants } from '../../../common/constants/clientConstants.constant';

const MAP = ClientConstants.AssignmentReviewMap;

function wrapSvg(pathD: string, fill: string, stroke: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MAP.SVG_VIEWBOX}" width="${MAP.SVG_ICON_SIZE_PX}" height="${MAP.SVG_ICON_SIZE_PX}" aria-hidden="true"><path fill="${fill}" stroke="${stroke}" stroke-width="${MAP.SVG_STROKE_WIDTH}" d="${pathD}"/></svg>`;
}

export function createUavDivIcon(accentColor: string): L.DivIcon {
  const color = accentColor || MAP.DEFAULT_UAV_ACCENT;
  const inner = wrapSvg(MAP.FLIGHT_SVG_PATH, color, MAP.BASE_COLOR_WHITE);
  const html = `<div class="${MAP.UAV_ICON_CLASS}" style="--ar-uav-accent:${color}">${inner}</div>`;
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

export function createMissionDivIcon(missionType: UAVType, accentColor: string): L.DivIcon {
  const color = accentColor || MAP.DEFAULT_MISSION_ACCENT;
  const path = missionType === UAVType.Armed ? MAP.TARGET_SVG_PATH : MAP.PLACE_SVG_PATH;
  const inner = wrapSvg(path, color, MAP.BASE_COLOR_WHITE);
  const html = `<div class="${MAP.MISSION_ICON_CLASS}" style="--ar-mission-accent:${color}">${inner}</div>`;
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
