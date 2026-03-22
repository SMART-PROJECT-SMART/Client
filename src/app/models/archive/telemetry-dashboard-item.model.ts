import type { GridsterItem } from 'angular-gridster2';
import type { TelemetryField } from '../../common/enums';
import type { ChartRowConfig } from './chart-row-config.model';

export type TileViewMode = 'chart' | 'table';

export interface TelemetryDashboardItem extends GridsterItem {
  field: TelemetryField;
  chartConfig: ChartRowConfig;
  viewMode: TileViewMode;
}
