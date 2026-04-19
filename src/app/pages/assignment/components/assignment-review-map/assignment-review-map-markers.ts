import * as L from 'leaflet';
import { UAVType } from '../../../../common/enums';
import {
  ASSIGNMENT_REVIEW_MAP_MISSION_ICON_HEIGHT_PX,
  ASSIGNMENT_REVIEW_MAP_MISSION_ICON_WIDTH_PX,
  ASSIGNMENT_REVIEW_MAP_UAV_ICON_HEIGHT_PX,
  ASSIGNMENT_REVIEW_MAP_UAV_ICON_WIDTH_PX,
} from './assignment-review-map.constants';

const FLIGHT_SVG_PATH =
  'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z';

const PLACE_SVG_PATH =
  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';

const TARGET_SVG_PATH =
  'M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.93V20h-2v-3.07A8.001 8.001 0 014.07 13H1v-2h3.07A8.001 8.001 0 0111 4.07V1h2v3.07A8.001 8.001 0 0119.93 11H23v2h-3.07A8.001 8.001 0 0113 16.93zM12 10a2 2 0 100 4 2 2 0 000-4z';

function wrapSvg(pathD: string, fill: string, stroke: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="${fill}" stroke="${stroke}" stroke-width="0.5" d="${pathD}"/></svg>`;
}

export function createUavDivIcon(accentColor: string): L.DivIcon {
  const inner = wrapSvg(FLIGHT_SVG_PATH, accentColor, '#ffffff');
  const html = `<div class="ar-map-icon ar-map-icon--uav" style="--ar-uav-accent:${accentColor}">${inner}</div>`;
  const w = ASSIGNMENT_REVIEW_MAP_UAV_ICON_WIDTH_PX;
  const h = ASSIGNMENT_REVIEW_MAP_UAV_ICON_HEIGHT_PX;
  return L.divIcon({
    html,
    className: 'ar-map-div-icon',
    iconSize: [w, h],
    iconAnchor: [Math.floor(w / 2), h],
    popupAnchor: [0, -h],
  });
}

export function createMissionDivIcon(missionType: UAVType, accentColor: string): L.DivIcon {
  const path = missionType === UAVType.Armed ? TARGET_SVG_PATH : PLACE_SVG_PATH;
  const inner = wrapSvg(path, accentColor, '#ffffff');
  const html = `<div class="ar-map-icon ar-map-icon--mission" style="--ar-mission-accent:${accentColor}">${inner}</div>`;
  const w = ASSIGNMENT_REVIEW_MAP_MISSION_ICON_WIDTH_PX;
  const h = ASSIGNMENT_REVIEW_MAP_MISSION_ICON_HEIGHT_PX;
  return L.divIcon({
    html,
    className: 'ar-map-div-icon',
    iconSize: [w, h],
    iconAnchor: [Math.floor(w / 2), h],
    popupAnchor: [0, -h],
  });
}
