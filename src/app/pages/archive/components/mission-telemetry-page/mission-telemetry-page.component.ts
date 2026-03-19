import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { ChartConfiguration, ChartDataset, Chart, Plugin } from 'chart.js';
import { TelemetryField } from '../../../../common/enums';
import { EnumUtil, TelemetryUtil } from '../../../../common/utils';
import { ArchiveApiService } from '../../../../services/archive/archive-api.service';
import type { MissionTelemetryRo } from '../../../../models/archive';

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

const CHART_COLORS: string[] = [
  '#ab47bc', '#42a5f5', '#66bb6a', '#ffa726', '#ef5350',
  '#26c6da', '#ffee58', '#8d6e63', '#78909c', '#ec407a',
  '#7e57c2', '#29b6f6', '#9ccc65', '#ffca28', '#ff7043',
  '#26a69a', '#d4e157', '#5c6bc0', '#ff8a65', '#bdbdbd',
];

export interface ChartRowConfig {
  field: TelemetryField;
  label: string;
  unit: string;
  color: string;
  data: ChartConfiguration<'line'>['data'];
  options: ChartConfiguration<'line'>['options'];
}

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

  readonly crosshairPlugin: Plugin<'line'> = {
    id: 'syncedCrosshair',
    afterEvent: (_chart: Chart, args: { event: { type: string; x: number | null } }) => {
      if (args.event.type === 'mousemove' && args.event.x !== null) {
        const xScale = _chart.scales['x'];
        const index = xScale.getValueForPixel(args.event.x);
        this.crosshairIndex.set(index !== undefined ? Math.round(index as number) : null);
        _chart.canvas.dispatchEvent(new CustomEvent('crosshair-sync'));
      }
      if (args.event.type === 'mouseout') {
        this.crosshairIndex.set(null);
      }
    },
    afterDraw: (_chart: Chart) => {
      const index = this.crosshairIndex();
      if (index === null) return;

      const xScale = _chart.scales['x'];
      const xPixel = xScale.getPixelForValue(index);
      const yScale = _chart.scales['y'];

      const ctx = _chart.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(xPixel, yScale.top);
      ctx.lineTo(xPixel, yScale.bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(245, 245, 245, 0.4)';
      ctx.stroke();
      ctx.restore();
    },
  };

  readonly chartConfigs = computed<ChartRowConfig[]>(() => {
    const selected = this.selectedFields();
    return selected.map((field, index) => {
      const color = CHART_COLORS[index % CHART_COLORS.length];
      const isLast = index === selected.length - 1;

      const datasets: ChartDataset<'line'>[] = [{
        label: EnumUtil.getTelemetryFieldDisplay(field),
        data: this.telemetryData.map((point) => point.fields[field] ?? null),
        borderColor: color,
        backgroundColor: color + '33',
        pointRadius: 0,
        borderWidth: 1.5,
        tension: 0.3,
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
              color: '#c0c0c0',
              maxTicksLimit: 20,
              font: { size: 10 },
            },
            grid: { color: 'rgba(68, 68, 68, 0.3)', drawTicks: isLast },
          },
          y: {
            ticks: {
              color: '#c0c0c0',
              font: { size: 10 },
              maxTicksLimit: 5,
            },
            grid: { color: 'rgba(68, 68, 68, 0.3)' },
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
    });
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

  readonly unselectedFields = computed<TelemetryField[]>(() => {
    const selected = new Set(this.selectedFields());
    return this.availableFields().filter((f) => !selected.has(f));
  });

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

  private fetchTelemetry(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.archiveApi
      .getMissionTelemetry(this.missionId, this.tailId())
      .subscribe({
        next: (data: MissionTelemetryRo[]) => {
          this.telemetryData = data;
          this.timeLabels = data.map((point) =>
            new Date(point.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),
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
    this.selectedFields.set(defaultSelected.length > 0 ? defaultSelected : available.slice(0, 3));
  }
}
