import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ClientConstants } from '../../../../common/constants/clientConstants.constant';
import { EnumUtil } from '../../../../common/utils';
import type { Mission } from '../../../../models';

const MAP = ClientConstants.AssignmentReviewMap;
const MISSION_TOOLTIP_DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: MAP.TOOLTIP_DATE_PART_DAY,
  month: MAP.TOOLTIP_DATE_PART_MONTH,
  hour: MAP.TOOLTIP_DATE_PART_HOUR,
  minute: MAP.TOOLTIP_DATE_PART_MINUTE,
};

@Component({
  selector: 'app-assignment-review-map-mission-tooltip',
  standalone: false,
  templateUrl: './assignment-review-map-mission-tooltip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentReviewMapMissionTooltipComponent {
  readonly mission = input.required<Mission>();

  readonly title = computed<string>(() => this.mission().title);
  readonly missionType = computed<string>(() => EnumUtil.getUAVTypeDisplay(this.mission().requiredUAVType));
  readonly priority = computed<string>(() => EnumUtil.getPriorityDisplay(this.mission().priority));
  readonly windowValue = computed<string>(() =>
    this.formatMissionTimeWindow(this.mission().timeWindow.start, this.mission().timeWindow.end),
  );
  readonly locationValue = computed<string>(() =>
    this.buildMissionLocationValue(
      this.mission().location.latitude,
      this.mission().location.longitude,
      this.mission().location.altitude,
    ),
  );

  readonly labels = {
    missionPriority: MAP.TOOLTIP_MISSION_PRIORITY_LABEL,
    missionWindow: MAP.TOOLTIP_MISSION_TIME_WINDOW_LABEL,
    missionLocation: MAP.TOOLTIP_MISSION_LOCATION_LABEL,
    typeBadgeClass: MAP.TOOLTIP_TYPE_BADGE_CLASS,
  } as const;

  private buildMissionLocationValue(latitude: number, longitude: number, altitude: number): string {
    const latitudeValue =
      `${MAP.TOOLTIP_MISSION_LATITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${latitude.toFixed(MAP.TOOLTIP_LAT_LON_DECIMALS)}${MAP.TOOLTIP_VALUE_DEGREE_SUFFIX}`;
    const longitudeValue =
      `${MAP.TOOLTIP_MISSION_LONGITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${longitude.toFixed(MAP.TOOLTIP_LAT_LON_DECIMALS)}${MAP.TOOLTIP_VALUE_DEGREE_SUFFIX}`;
    const altitudeValue =
      `${MAP.TOOLTIP_MISSION_ALTITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${altitude.toFixed(MAP.TOOLTIP_VALUE_DECIMALS)}${MAP.TOOLTIP_VALUE_SPACE}${MAP.TOOLTIP_ALTITUDE_UNIT}`;
    return [latitudeValue, longitudeValue, altitudeValue].join(MAP.TOOLTIP_MISSION_COORDINATE_SEPARATOR);
  }

  private formatMissionTimeWindow(start: Date, end: Date): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return MAP.TOOLTIP_VALUE_UNAVAILABLE;
    }

    const dateTimeFormat = new Intl.DateTimeFormat(
      MAP.TOOLTIP_DATE_TIME_LOCALE,
      MISSION_TOOLTIP_DATE_TIME_FORMAT_OPTIONS,
    );

    return `${dateTimeFormat.format(startDate)}${MAP.TOOLTIP_TIME_WINDOW_RANGE_SEPARATOR}${dateTimeFormat.format(endDate)}`;
  }
}

