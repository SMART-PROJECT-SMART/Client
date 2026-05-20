import type { ChartConfiguration } from 'chart.js';
import type { TelemetryField } from '../../common/enums';

export interface ChartRowConfig {
  field: TelemetryField;
  label: string;
  unit: string;
  color: string;
  data: ChartConfiguration<'line'>['data'];
  options: ChartConfiguration<'line'>['options'];
}
