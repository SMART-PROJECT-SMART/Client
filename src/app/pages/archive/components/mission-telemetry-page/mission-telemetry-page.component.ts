import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, effect, viewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import type { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { GridType, CompactType } from 'angular-gridster2';
import type { GridsterConfig } from 'angular-gridster2';
import type { ChartConfiguration, ChartDataset, Plugin } from 'chart.js';
import { TelemetryField } from '../../../../common/enums';
import { EnumUtil, TelemetryUtil } from '../../../../common/utils';
import { ClientConstants } from '../../../../common/constants/clientConstants.constant';
import { createCrosshairPlugin } from '../../../../common/utils/crosshair-plugin.util';
import { ArchiveApiService } from '../../../../services/archive/archive-api.service';
import type { MissionTelemetryRo, ChartRowConfig, TelemetryDashboardItem } from '../../../../models/archive';

const { COLORS, BACKGROUND_ALPHA, POINT_RADIUS, BORDER_WIDTH, LINE_TENSION,
  X_AXIS_MAX_TICKS, Y_AXIS_MAX_TICKS, TICK_FONT_SIZE, TICK_COLOR, GRID_COLOR,
  TIME_AXIS_LABEL,
} = ClientConstants.ChartConfig;

const { LOCALE, OPTIONS: TIME_FORMAT_OPTIONS } = ClientConstants.TimeFormat;

const { DEFAULT_COLUMNS, DEFAULT_ITEM_COLS, DEFAULT_ITEM_ROWS, FIXED_ROW_HEIGHT,
  MARGIN, MIN_ITEM_COLS, MIN_ITEM_ROWS, DRAG_HANDLE_CLASS, NO_DRAG_CLASS,
} = ClientConstants.GridsterDashboard;

const { NO_MISSION_ID, LOAD_FAILED } = ClientConstants.TelemetryPageMessages;
const { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE, TIMESTAMP_COLUMN } = ClientConstants.TableConfig;
const { ARCHIVE } = ClientConstants.ArchiveRoutes;
const { MISSION_ID: MISSION_ID_PARAM, TAIL_ID: TAIL_ID_PARAM, TITLE: TITLE_PARAM } = ClientConstants.TelemetryQueryParams;

const NON_GRAPHABLE_FIELDS = new Set<string>([
  TelemetryField.TailId,
  TelemetryField.UAVTypeValue,
  TelemetryField.PlatformType,
  TelemetryField.NearestSleeveId,
  TelemetryField.MissionId,
  TelemetryField.LandingGearStatus,
]);

const DEFAULT_SELECTED_FIELDS: TelemetryField[] = [];

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
  readonly dashboardItems = signal<TelemetryDashboardItem[]>([]);
  readonly parameterSearch = signal<string>('');

  readonly tableDataSource = new MatTableDataSource<Record<string, string | number | null>>([]);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly defaultPageSize = DEFAULT_PAGE_SIZE;

  private readonly paramSearchInput = viewChild<ElementRef<HTMLInputElement>>('paramSearchInput');
  readonly tableSort = viewChild<MatSort>(MatSort);
  readonly tablePaginator = viewChild<MatPaginator>(MatPaginator);

  private missionId = '';
  private telemetryData: MissionTelemetryRo[] = [];
  private timeLabels: string[] = [];

  readonly crosshairIndex = signal<number | null>(null);
  readonly crosshairPlugin: Plugin<'line'> = createCrosshairPlugin(this.crosshairIndex);

  private readonly sortEffect = effect(() => {
    const sort = this.tableSort();
    if (sort) this.tableDataSource.sort = sort;
  });

  private readonly paginatorEffect = effect(() => {
    const paginator = this.tablePaginator();
    if (paginator) this.tableDataSource.paginator = paginator;
  });

  readonly gridsterOptions: GridsterConfig = {
    gridType: GridType.VerticalFixed,
    compactType: CompactType.CompactUpAndLeft,
    fixedRowHeight: FIXED_ROW_HEIGHT,
    margin: MARGIN,
    outerMargin: true,
    minCols: DEFAULT_COLUMNS,
    maxCols: DEFAULT_COLUMNS,
    minItemCols: MIN_ITEM_COLS,
    minItemRows: MIN_ITEM_ROWS,
    defaultItemCols: DEFAULT_ITEM_COLS,
    defaultItemRows: DEFAULT_ITEM_ROWS,
    draggable: {
      enabled: true,
      dragHandleClass: DRAG_HANDLE_CLASS,
      ignoreContentClass: NO_DRAG_CLASS,
    },
    resizable: {
      enabled: true,
    },
    pushItems: true,
    swap: false,
  };

  readonly unselectedFields = computed<TelemetryField[]>(() => {
    const selected = new Set(this.selectedFields());
    return this.availableFields().filter((f) => !selected.has(f));
  });

  readonly filteredUnselectedFields = computed<TelemetryField[]>(() => {
    const query = this.parameterSearch().toLowerCase().trim();
    const unselected = this.unselectedFields();
    if (!query) return unselected;
    return unselected.filter((f) =>
      EnumUtil.getTelemetryFieldDisplay(f).toLowerCase().includes(query),
    );
  });

  readonly displayedColumns = computed<string[]>(() => {
    return [TIMESTAMP_COLUMN, ...this.selectedFields()];
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    this.missionId = params[MISSION_ID_PARAM] ?? '';
    this.tailId.set(Number(params[TAIL_ID_PARAM]) || 0);
    this.missionTitle.set(params[TITLE_PARAM] ?? '');

    if (!this.missionId) {
      this.errorMessage.set(NO_MISSION_ID);
      this.loading.set(false);
      return;
    }

    this.fetchTelemetry();
  }

  addField(field: TelemetryField): void {
    this.selectedFields.set([...this.selectedFields(), field]);
    this.parameterSearch.set('');
    this.rebuildDashboardItems();
    this.populateTableData();
  }

  removeField(field: TelemetryField): void {
    this.selectedFields.set(this.selectedFields().filter((f) => f !== field));
    this.rebuildDashboardItems();
    this.populateTableData();
  }

  getFieldLabel(field: TelemetryField): string {
    return EnumUtil.getTelemetryFieldDisplay(field);
  }

  onParameterSearchInput(event: Event): void {
    this.parameterSearch.set((event.target as HTMLInputElement).value);
  }

  onParameterSelected(event: MatAutocompleteSelectedEvent, input: HTMLInputElement): void {
    this.addField(event.option.value as TelemetryField);
    input.value = '';
  }

  focusSearchInput(): void {
    this.paramSearchInput()?.nativeElement.focus();
  }

  goBack(): void {
    this.router.navigate([ARCHIVE]);
  }

  private rebuildDashboardItems(): void {
    const selected = this.selectedFields();
    const items: TelemetryDashboardItem[] = selected.map((field, index) => {
      const chartConfig = this.buildChartRowConfig(field, index);
      return {
        x: index % DEFAULT_COLUMNS,
        y: Math.floor(index / DEFAULT_COLUMNS),
        cols: DEFAULT_ITEM_COLS,
        rows: DEFAULT_ITEM_ROWS,
        field,
        chartConfig,
      };
    });
    this.dashboardItems.set(items);
  }

  private buildChartRowConfig(field: TelemetryField, index: number): ChartRowConfig {
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
          this.errorMessage.set(LOAD_FAILED);
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

    this.selectedFields.set(DEFAULT_SELECTED_FIELDS);

    this.rebuildDashboardItems();
    this.populateTableData();
  }

  private populateTableData(): void {
    const selected = this.selectedFields();
    const rows: Record<string, string | number | null>[] = this.telemetryData.map((point, index) => {
      const row: Record<string, string | number | null> = {
        [TIMESTAMP_COLUMN]: this.timeLabels[index],
      };
      for (const field of selected) {
        row[field] = point.fields[field] ?? null;
      }
      return row;
    });
    this.tableDataSource.data = rows;
  }
}
