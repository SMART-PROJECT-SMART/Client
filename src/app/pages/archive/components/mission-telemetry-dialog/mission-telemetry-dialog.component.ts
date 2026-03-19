import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChartConfiguration, ChartDataset } from 'chart.js';
import { TelemetryField } from '../../../../common/enums';
import { EnumUtil, TelemetryUtil } from '../../../../common/utils';
import { ArchiveApiService } from '../../../../services/archive/archive-api.service';
import type { MissionTelemetryRo } from '../../../../models/archive';

export interface MissionTelemetryDialogData {
  missionId: string;
  missionTitle: string;
  tailId: number;
}

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

@Component({
  selector: 'app-mission-telemetry-dialog',
  standalone: false,
  templateUrl: './mission-telemetry-dialog.component.html',
  styleUrl: './mission-telemetry-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionTelemetryDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<MissionTelemetryDialogComponent>);
  private readonly archiveApi = inject(ArchiveApiService);
  readonly data: MissionTelemetryDialogData = inject(MAT_DIALOG_DATA);
  readonly EnumUtil = EnumUtil;

  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');
  readonly availableFields = signal<TelemetryField[]>([]);
  readonly selectedFields = signal<TelemetryField[]>([]);

  private telemetryData: MissionTelemetryRo[] = [];

  readonly chartData = signal<ChartConfiguration<'line'>['data']>({
    datasets: [],
  });

  readonly chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        type: 'category',
        ticks: {
          color: '#c0c0c0',
          maxTicksLimit: 20,
          font: { size: 10 },
        },
        grid: { color: 'rgba(68, 68, 68, 0.5)' },
      },
      y: {
        ticks: {
          color: '#c0c0c0',
          font: { size: 10 },
        },
        grid: { color: 'rgba(68, 68, 68, 0.5)' },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#f5f5f5',
          font: { size: 11 },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  ngOnInit(): void {
    this.fetchTelemetry();
  }

  onFieldToggle(field: TelemetryField): void {
    const current = this.selectedFields();
    const index = current.indexOf(field);

    if (index >= 0) {
      this.selectedFields.set(current.filter((f) => f !== field));
    } else {
      this.selectedFields.set([...current, field]);
    }

    this.rebuildChart();
  }

  isFieldSelected(field: TelemetryField): boolean {
    return this.selectedFields().includes(field);
  }

  getFieldLabel(field: TelemetryField): string {
    return EnumUtil.getTelemetryFieldDisplay(field);
  }

  close(): void {
    this.dialogRef.close();
  }

  private fetchTelemetry(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.archiveApi
      .getMissionTelemetry(
        this.data.missionId,
        this.data.tailId,
      )
      .subscribe({
        next: (data: MissionTelemetryRo[]) => {
          this.telemetryData = data;
          this.initializeFields();
          this.rebuildChart();
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

  private rebuildChart(): void {
    const selected = this.selectedFields();
    const labels = this.telemetryData.map((point) =>
      new Date(point.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
    );

    const datasets: ChartDataset<'line'>[] = selected.map((field, index) => ({
      label: `${EnumUtil.getTelemetryFieldDisplay(field)} ${TelemetryUtil.getUnit(field)}`,
      data: this.telemetryData.map((point) => point.fields[field] ?? null),
      borderColor: CHART_COLORS[index % CHART_COLORS.length],
      backgroundColor: CHART_COLORS[index % CHART_COLORS.length] + '33',
      pointRadius: 0,
      borderWidth: 1.5,
      tension: 0.3,
      fill: false,
    }));

    this.chartData.set({ labels, datasets });
  }
}
