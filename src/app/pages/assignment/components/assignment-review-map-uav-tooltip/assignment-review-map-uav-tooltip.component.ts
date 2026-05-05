import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ClientConstants } from '../../../../common/constants/clientConstants.constant';
import { TelemetryField, UAVType } from '../../../../common/enums';
import { EnumUtil, TelemetryUtil } from '../../../../common/utils';
import { TelemetryDisplayValueUtil } from '../../../../common/utils/telemetry-display-value.util';
import type { Mission, UAV } from '../../../../models';

const MAP = ClientConstants.AssignmentReviewMap;
const UAV_TOOLTIP_ARMED_FIELDS: readonly TelemetryField[] = [TelemetryField.AmmoPercentage];
const UAV_TOOLTIP_SURVEILLANCE_FIELDS: readonly TelemetryField[] = [TelemetryField.DataStorageUsedGB];
const UAV_TOOLTIP_DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: MAP.TOOLTIP_DATE_PART_DAY,
  month: MAP.TOOLTIP_DATE_PART_MONTH,
  hour: MAP.TOOLTIP_DATE_PART_HOUR,
  minute: MAP.TOOLTIP_DATE_PART_MINUTE,
};

@Component({
  selector: 'app-assignment-review-map-uav-tooltip',
  standalone: false,
  templateUrl: './assignment-review-map-uav-tooltip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentReviewMapUavTooltipComponent {
  public readonly uav = input.required<UAV>();
  public readonly telemetry = input.required<Record<TelemetryField, number>>();
  public readonly activeMission = input<Mission | null>(null);
  public readonly relativeScore = input<number | null>(null);

  public readonly title = computed<string>(() => `${MAP.TOOLTIP_UAV_PREFIX}${this.uav().tailId}`);
  public readonly uavTypeLabel = computed<string>(() => EnumUtil.getUAVTypeDisplay(this.uav().uavType));

  public readonly positionRows = computed<Array<{ label: string; value: string }>>(() => {
    const telemetry = this.telemetry();
    return [
      this.buildRow(TelemetryField.Latitude, telemetry[TelemetryField.Latitude]),
      this.buildRow(TelemetryField.Longitude, telemetry[TelemetryField.Longitude]),
      this.buildRow(TelemetryField.Altitude, telemetry[TelemetryField.Altitude]),
    ];
  });

  public readonly statusRows = computed<Array<{ label: string; value: string }>>(() => {
    const telemetry = this.telemetry();
    const fields =
      this.uav().uavType === UAVType.Armed
        ? [TelemetryField.FuelAmount, ...UAV_TOOLTIP_ARMED_FIELDS]
        : [TelemetryField.FuelAmount, ...UAV_TOOLTIP_SURVEILLANCE_FIELDS];
    return fields.map((field) => this.buildRow(field, telemetry[field]));
  });

  public readonly hasActiveMission = computed<boolean>(() => this.activeMission() !== null);
  public readonly hasRelativeScore = computed<boolean>(() => this.relativeScore() !== null);

  public readonly relativeScoreRow = computed<{ label: string; value: string } | null>(() => {
    const relativeScore = this.relativeScore();
    if (relativeScore === null) {
      return null;
    }

    return {
      label: MAP.TOOLTIP_RELATIVE_SCORE_LABEL,
      value: `${relativeScore.toFixed(MAP.TACTICAL_SCORE_TOOLTIP_DECIMALS)}${MAP.TACTICAL_SCORE_SUFFIX}`,
    };
  });

  public readonly activeMissionRows = computed<Array<{ label: string; value: string }>>(() => {
    const activeMission = this.activeMission();
    if (!activeMission) {
      return [];
    }

    const missionType = EnumUtil.getUAVTypeDisplay(activeMission.requiredUAVType);
    const missionTitle =
      `${activeMission.title}${MAP.TOOLTIP_MISSION_SUFFIX_OPEN}${missionType}${MAP.TOOLTIP_MISSION_SUFFIX_CLOSE}`;
    const priority = EnumUtil.getPriorityDisplay(activeMission.priority);
    const location = this.buildMissionLocationValue(
      activeMission.location.latitude,
      activeMission.location.longitude,
      activeMission.location.altitude,
    );
    const timeWindow = this.formatMissionTimeWindow(activeMission.timeWindow.start, activeMission.timeWindow.end);

    return [
      { label: MAP.TOOLTIP_ACTIVE_MISSION_ID_LABEL, value: activeMission.id },
      { label: MAP.TOOLTIP_ACTIVE_MISSION_MISSION_LABEL, value: missionTitle },
      { label: MAP.TOOLTIP_ACTIVE_MISSION_PRIORITY_LABEL, value: priority },
      { label: MAP.TOOLTIP_ACTIVE_MISSION_LOCATION_LABEL, value: location },
      { label: MAP.TOOLTIP_ACTIVE_MISSION_TIME_WINDOW_LABEL, value: timeWindow },
    ];
  });

  public readonly labels = {
    positionSectionTitle: MAP.TOOLTIP_POSITION_SECTION_TITLE,
    statusSectionTitle: MAP.TOOLTIP_STATUS_SECTION_TITLE,
    relativeScoreSectionTitle: MAP.TOOLTIP_RELATIVE_SCORE_SECTION_TITLE,
    activeMissionSectionTitle: MAP.TOOLTIP_ACTIVE_MISSION_SECTION_TITLE,
    typeBadgeClass: MAP.TOOLTIP_TYPE_BADGE_CLASS,
  } as const;

  private buildRow(field: TelemetryField, value: number | undefined): { label: string; value: string } {
    return {
      label: EnumUtil.getTelemetryFieldDisplay(field),
      value: this.formatTelemetryValue(field, value),
    };
  }

  private formatTelemetryValue(field: TelemetryField, value: number | undefined): string {
    if (value === undefined || Number.isNaN(value)) {
      return MAP.TOOLTIP_VALUE_UNAVAILABLE;
    }
    if (field === TelemetryField.Latitude || field === TelemetryField.Longitude) {
      return `${value.toFixed(MAP.TOOLTIP_LAT_LON_DECIMALS)}${MAP.TOOLTIP_VALUE_DEGREE_SUFFIX}`;
    }

    const displayValue = TelemetryDisplayValueUtil.toChartOrTableValue(
      field,
      value,
      this.telemetry(),
    );
    const unit = TelemetryUtil.getUnit(field).replace('(', '').replace(')', '');
    const precision =
      field === TelemetryField.FuelAmount || field === TelemetryField.DataStorageUsedGB
        ? MAP.TOOLTIP_STATUS_VALUE_DECIMALS
        : field === TelemetryField.AmmoPercentage
          ? 0
          : MAP.TOOLTIP_VALUE_DECIMALS;

    if (!unit) {
      return displayValue.toFixed(precision);
    }
    return `${displayValue.toFixed(precision)}${MAP.TOOLTIP_VALUE_SPACE}${unit}`;
  }

  private buildMissionLocationValue(latitude: number, longitude: number, altitude: number): string {
    const latitudeValue =
      `${MAP.TOOLTIP_MISSION_LATITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${latitude.toFixed(MAP.TOOLTIP_LAT_LON_DECIMALS)}${MAP.TOOLTIP_VALUE_DEGREE_SUFFIX}`;
    const longitudeValue =
      `${MAP.TOOLTIP_MISSION_LONGITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${longitude.toFixed(MAP.TOOLTIP_LAT_LON_DECIMALS)}${MAP.TOOLTIP_VALUE_DEGREE_SUFFIX}`;
    const altitudeValue =
      `${MAP.TOOLTIP_MISSION_ALTITUDE_LABEL}${MAP.TOOLTIP_MISSION_KEY_VALUE_SEPARATOR}${this.formatTelemetryValue(TelemetryField.Altitude, altitude)}`;
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
      UAV_TOOLTIP_DATE_TIME_FORMAT_OPTIONS,
    );

    return `${dateTimeFormat.format(startDate)}${MAP.TOOLTIP_TIME_WINDOW_RANGE_SEPARATOR}${dateTimeFormat.format(endDate)}`;
  }
}

