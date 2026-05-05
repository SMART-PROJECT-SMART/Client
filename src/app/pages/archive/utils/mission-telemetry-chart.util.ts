import type { ChartConfiguration, ChartDataset } from 'chart.js';
import { TelemetryField } from '../../../common/enums';
import { EnumUtil, TelemetryUtil } from '../../../common/utils';
import { ClientConstants } from '../../../common/constants/clientConstants.constant';
import { TelemetryDisplayValueUtil } from '../../../common/utils/telemetry-display-value.util';
import type { ChartRowConfig, MissionTelemetryRo } from '../../../models/archive';

const {
  COLORS,
  BACKGROUND_ALPHA,
  POINT_RADIUS,
  BORDER_WIDTH,
  LINE_TENSION,
  X_AXIS_MAX_TICKS,
  Y_AXIS_MAX_TICKS,
  TICK_FONT_SIZE,
  TICK_COLOR,
  GRID_COLOR,
  TIME_AXIS_LABEL,
} = ClientConstants.ChartConfig;

export function buildTelemetryChartRowConfig(params: {
  field: TelemetryField;
  colorIndex: number;
  viewTelemetry: MissionTelemetryRo[];
  timeLabels: string[];
}): ChartRowConfig {
  const { field, colorIndex, viewTelemetry, timeLabels } = params;
  const color = COLORS[colorIndex % COLORS.length];

  const datasets: ChartDataset<'line'>[] = [
    {
      label: EnumUtil.getTelemetryFieldDisplay(field),
      data: viewTelemetry.map((point) => {
        const rawValue = point.fields[field];
        if (rawValue === undefined || rawValue === null) return null;
        return TelemetryDisplayValueUtil.toChartOrTableValue(field, rawValue, point.fields);
      }),
      borderColor: color,
      backgroundColor: color + BACKGROUND_ALPHA,
      pointRadius: POINT_RADIUS,
      borderWidth: BORDER_WIDTH,
      tension: LINE_TENSION,
      fill: false,
    },
  ];

  const options: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: TIME_AXIS_LABEL,
          color: TICK_COLOR,
          font: { size: TICK_FONT_SIZE },
        },
        ticks: {
          color: TICK_COLOR,
          maxTicksLimit: X_AXIS_MAX_TICKS,
          font: { size: TICK_FONT_SIZE },
        },
        grid: { color: GRID_COLOR },
      },
      y: {
        title: {
          display: true,
          text: `${EnumUtil.getTelemetryFieldDisplay(field)} (${TelemetryUtil.getUnit(field)})`,
          color: TICK_COLOR,
          font: { size: TICK_FONT_SIZE },
        },
        ticks: {
          color: TICK_COLOR,
          font: { size: TICK_FONT_SIZE },
          maxTicksLimit: Y_AXIS_MAX_TICKS,
        },
        grid: { color: GRID_COLOR },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: (items) => items[0]?.label ?? '',
          label: (item) =>
            `${EnumUtil.getTelemetryFieldDisplay(field)}: ${item.formattedValue} ${TelemetryUtil.getUnit(field)}`,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return {
    field,
    label: EnumUtil.getTelemetryFieldDisplay(field),
    unit: TelemetryUtil.getUnit(field),
    color,
    data: { labels: timeLabels, datasets },
    options,
  };
}
