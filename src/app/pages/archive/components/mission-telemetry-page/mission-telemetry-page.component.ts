import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { ChartConfiguration, ChartDataset, Plugin } from 'chart.js';
import { TelemetryField } from '../../../../common/enums';
import { EnumUtil, TelemetryUtil } from '../../../../common/utils';
import { ClientConstants } from '../../../../common/constants/clientConstants.constant';
import { createCrosshairPlugin } from '../../../../common/utils/crosshair-plugin.util';
import { ArchiveApiService } from '../../../../services/archive/archive-api.service';
import type { MissionTelemetryRo, ChartRowConfig } from '../../../../models/archive';

const { COLORS, BACKGROUND_ALPHA, POINT_RADIUS, BORDER_WIDTH, LINE_TENSION,
  X_AXIS_MAX_TICKS, Y_AXIS_MAX_TICKS, TICK_FONT_SIZE, TICK_COLOR, GRID_COLOR,
} = ClientConstants.ChartConfig;

const { LOCALE, OPTIONS: TIME_FORMAT_OPTIONS } = ClientConstants.TimeFormat;

const NON_GRAPHABLE_FIELDS = new Set<string>([
  TelemetryField.TailId,
  TelemetryField.UAVTypeValue,
  TelemetryField.PlatformType,
  TelemetryField.NearestSleeveId,
  TelemetryField.MissionId,
  TelemetryField.LandingGearStatus,
]);

const DEFAULT_SELECTED_FIELDS: TelemetryField[] = [
  TelemetryField.Altitude,
  TelemetryField.CurrentSpeedKmph,
  TelemetryField.FuelAmount,
];

const DEFAULT_SELECTED_COUNT = 3;

@Component({
  selector: 'app-mission-telemetry-page',
  standalone: false,
  templateUrl: './mission-telemetry-page.component.html',
  styleUrl: './mission-telemetry-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionTelemetryPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly archiveApi = inject(ArchiveApiService);

  readonly missionTitle = signal<string>('');
  readonly tailId = signal<number>(0);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');
  readonly availableFields = signal<TelemetryField[]>([]);
  readonly selectedFields = signal<TelemetryField[]>([]);

  private missionId = '';
  private telemetryData: MissionTelemetryRo[] = [];
  private timeLabels: string[] = [];

  readonly crosshairIndex = signal<number | null>(null);
  readonly crosshairPlugin: Plugin<'line'> = createCrosshairPlugin(this.crosshairIndex);

  readonly unselectedFields = computed<TelemetryField[]>(() => {
    const selected = new Set(this.selectedFields());
    return this.availableFields().filter((f) => !selected.has(f));
  });

  readonly chartConfigs = computed<ChartRowConfig[]>(() => {
    const selected = this.selectedFields();
    return selected.map((field, index) => this.buildChartRowConfig(field, index, index === selected.length - 1));
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    this.missionId = params['missionId'] ?? '';
    this.tailId.set(Number(params['tailId']) || 0);
    this.missionTitle.set(params['title'] ?? '');

    if (!this.missionId) {
      this.errorMessage.set('No mission ID provided.');
      this.loading.set(false);
      return;
    }

    this.fetchTelemetry();
  }

  addField(field: TelemetryField): void {
    this.selectedFields.set([...this.selectedFields(), field]);
  }

  removeField(field: TelemetryField): void {
    this.selectedFields.set(this.selectedFields().filter((f) => f !== field));
  }

  getFieldLabel(field: TelemetryField): string {
    return EnumUtil.getTelemetryFieldDisplay(field);
  }

  goBack(): void {
    this.router.navigate(['/archive']);
  }

  private buildChartRowConfig(field: TelemetryField, index: number, isLast: boolean): ChartRowConfig {
    const color = COLORS[index % COLORS.length];

    const datasets: ChartDataset<'line'>[] = [{
      label: EnumUtil.getTelemetryFieldDisplay(field),
      data: this.telemetryData.map((point) => point.fields[field] ?? null),
      borderColor: color,
      backgroundColor: color + BACKGROUND_ALPHA,
      pointRadius: POINT_RADIUS,
      borderWidth: BORDER_WIDTH,
      tension: LINE_TENSION,
      fill: false,
    }];

    const options: ChartConfiguration<'line'>['options'] = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          type: 'category',
          ticks: {
            display: isLast,
            color: TICK_COLOR,
            maxTicksLimit: X_AXIS_MAX_TICKS,
            font: { size: TICK_FONT_SIZE },
          },
          grid: { color: GRID_COLOR, drawTicks: isLast },
        },
        y: {
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
      data: { labels: this.timeLabels, datasets },
      options,
    };
  }

  private fetchTelemetry(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.archiveApi
      .getMissionTelemetry(this.missionId, this.tailId())
      .subscribe({
        next: (data: MissionTelemetryRo[]) => {
          this.telemetryData = data;
          this.timeLabels = data.map((point) =>
            new Date(point.timestamp).toLocaleTimeString(LOCALE, TIME_FORMAT_OPTIONS),
          );
          this.initializeFields();
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Failed to load telemetry data.');
          this.loading.set(false);
        },
      });
  }

  private initializeFields(): void {
    if (this.telemetryData.length === 0) {
      return;
    }

    const fieldSet = new Set<string>();
    for (const point of this.telemetryData) {
      for (const key of Object.keys(point.fields)) {
        if (!NON_GRAPHABLE_FIELDS.has(key)) {
          fieldSet.add(key);
        }
      }
    }

    const available = [...fieldSet] as TelemetryField[];
    this.availableFields.set(available);

    const defaultSelected = DEFAULT_SELECTED_FIELDS.filter((f) => available.includes(f));
    this.selectedFields.set(
      defaultSelected.length > 0 ? defaultSelected : available.slice(0, DEFAULT_SELECTED_COUNT),
    );
  }
}
