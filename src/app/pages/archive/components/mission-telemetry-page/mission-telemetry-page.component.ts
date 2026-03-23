import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, OnDestroy, viewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import type { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Subject } from 'rxjs';
import { debounceTime, switchMap, takeUntil } from 'rxjs/operators';
import { GridType, CompactType } from 'angular-gridster2';
import type { GridsterConfig } from 'angular-gridster2';
import type { ChartConfiguration, ChartDataset, Plugin } from 'chart.js';
import { TelemetryField } from '../../../../common/enums';
import { EnumUtil, TelemetryUtil } from '../../../../common/utils';
import { ClientConstants } from '../../../../common/constants/clientConstants.constant';
import { createCrosshairPlugin } from '../../../../common/utils/crosshair-plugin.util';
import { ArchiveApiService } from '../../../../services/archive/archive-api.service';
import { MissionDetailsDialogComponent } from '../mission-details-dialog/mission-details-dialog.component';
import type { ArchiveMissionRo, MissionTelemetryRo, ChartRowConfig, TelemetryDashboardItem, TileViewMode } from '../../../../models/archive';

const { COLORS, BACKGROUND_ALPHA, POINT_RADIUS, BORDER_WIDTH, LINE_TENSION,
  X_AXIS_MAX_TICKS, Y_AXIS_MAX_TICKS, TICK_FONT_SIZE, TICK_COLOR, GRID_COLOR,
  TIME_AXIS_LABEL,
} = ClientConstants.ChartConfig;

const { LOCALE, OPTIONS: TIME_FORMAT_OPTIONS } = ClientConstants.TimeFormat;

const { DEFAULT_COLUMNS, DEFAULT_ITEM_COLS, DEFAULT_ITEM_ROWS, FIXED_ROW_HEIGHT,
  MARGIN, MIN_ITEM_COLS, MIN_ITEM_ROWS, DRAG_HANDLE_CLASS, NO_DRAG_CLASS,
  VIEW_MODE_CHART, VIEW_MODE_TABLE,
  TILE_HEADER_HEIGHT, TABLE_HEADER_HEIGHT, PAGINATION_HEIGHT, TABLE_ROW_HEIGHT, MIN_PAGE_SIZE,
} = ClientConstants.GridsterDashboard;

const { NO_MISSION_ID, LOAD_FAILED } = ClientConstants.TelemetryPageMessages;
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

type TelemetryTableRowView = { timestamp: string; value: number | null; trackId: string };

@Component({
  selector: 'app-mission-telemetry-page',
  standalone: false,
  templateUrl: './mission-telemetry-page.component.html',
  styleUrl: './mission-telemetry-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionTelemetryPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly archiveApi = inject(ArchiveApiService);

  readonly missionTitle = signal<string>('');
  readonly tailId = signal<number>(0);
  readonly missionDetails = signal<ArchiveMissionRo | null>(null);
  readonly fetchingData = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly availableFields = signal<TelemetryField[]>([]);
  readonly selectedFields = signal<TelemetryField[]>([]);
  readonly dashboardItems = signal<TelemetryDashboardItem[]>([]);
  readonly parameterSearch = signal<string>('');
  readonly tilePages = signal<Map<TelemetryField, number>>(new Map());
  readonly viewModeChart = VIEW_MODE_CHART;
  readonly timeRangeStart = signal<string | null>(null);
  readonly timeRangeEnd = signal<string | null>(null);

  private readonly paramSearchInput = viewChild<ElementRef<HTMLInputElement>>('paramSearchInput');

  private missionId = '';
  private readonly telemetryData = signal<MissionTelemetryRo[]>([]);
  private readonly timeLabels = signal<string[]>([]);
  private readonly fetchTrigger$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();
  readonly tableRowsByField = computed(() => {
    this.telemetryData();
    this.timeLabels();
    const items = this.dashboardItems();
    const pages = this.tilePages();
    const map = new Map<TelemetryField, TelemetryTableRowView[]>();
    for (const item of items) {
      if (item.viewMode !== VIEW_MODE_TABLE) continue;
      const field = item.field;
      const pageSize = this.getPageSize(item.rows);
      const page = pages.get(field) ?? 0;
      const start = page * pageSize;
      const allData = this.getFieldTableData(field);
      const sliced = allData.slice(start, start + pageSize).map((row, i) => ({
        ...row,
        trackId: `${String(field)}|${start + i}`,
      }));
      map.set(field, sliced);
    }
    return map;
  });

  readonly crosshairIndex = signal<number | null>(null);
  readonly crosshairPlugin: Plugin<'line'> = createCrosshairPlugin(this.crosshairIndex);

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
    itemResizeCallback: () => {
      this.dashboardItems.set([...this.dashboardItems()]);
      this.clampTilePagesToTotal();
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

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    this.missionId = params[MISSION_ID_PARAM] ?? '';
    this.tailId.set(Number(params[TAIL_ID_PARAM]) || 0);
    this.missionTitle.set(params[TITLE_PARAM] ?? '');

    if (!this.missionId) {
      this.errorMessage.set(NO_MISSION_ID);
      return;
    }

    const allFields = Object.values(TelemetryField).filter((f) => !NON_GRAPHABLE_FIELDS.has(f));
    this.availableFields.set(allFields);

    this.archiveApi.getMissionById(this.missionId).subscribe({
      next: (mission) => this.missionDetails.set(mission),
    });

    this.fetchTrigger$
      .pipe(
        debounceTime(300),
        switchMap(() => {
          const fields = this.selectedFields();
          if (fields.length === 0) {
            this.telemetryData.set([]);
            this.timeLabels.set([]);
            this.dashboardItems.set([]);
            this.fetchingData.set(false);
            return [];
          }
          this.fetchingData.set(true);
          this.errorMessage.set('');
          return this.archiveApi.getMissionTelemetry(
            this.missionId,
            this.tailId(),
            fields,
            this.timeRangeStart(),
            this.timeRangeEnd(),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (data: MissionTelemetryRo[]) => {
          this.telemetryData.set(data);
          this.timeLabels.set(data.map((point) =>
            new Date(point.timestamp).toLocaleTimeString(LOCALE, TIME_FORMAT_OPTIONS),
          ));
          this.rebuildDashboardItems();
          this.fetchingData.set(false);
        },
        error: () => {
          this.errorMessage.set(LOAD_FAILED);
          this.fetchingData.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addField(field: TelemetryField): void {
    this.selectedFields.set([...this.selectedFields(), field]);
    this.parameterSearch.set('');
    const pages = new Map(this.tilePages());
    pages.set(field, 0);
    this.tilePages.set(pages);
    this.fetchTrigger$.next();
  }

  removeField(field: TelemetryField): void {
    this.selectedFields.set(this.selectedFields().filter((f) => f !== field));
    const pages = new Map(this.tilePages());
    pages.delete(field);
    this.tilePages.set(pages);
    this.fetchTrigger$.next();
  }

  onTimeRangeStartChange(value: string): void {
    this.timeRangeStart.set(value || null);
    if (this.selectedFields().length > 0) this.fetchTrigger$.next();
  }

  onTimeRangeEndChange(value: string): void {
    this.timeRangeEnd.set(value || null);
    if (this.selectedFields().length > 0) this.fetchTrigger$.next();
  }

  resetTimeRange(): void {
    this.timeRangeStart.set(null);
    this.timeRangeEnd.set(null);
    if (this.selectedFields().length > 0) this.fetchTrigger$.next();
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

  toggleViewMode(field: TelemetryField): void {
    const items = this.dashboardItems();
    const updated = items.map((item) => {
      if (item.field !== field) return item;
      const nextMode: TileViewMode = item.viewMode === VIEW_MODE_CHART ? VIEW_MODE_TABLE as TileViewMode : VIEW_MODE_CHART as TileViewMode;
      return { ...item, viewMode: nextMode };
    });
    this.dashboardItems.set(updated);
  }

  getFieldTableData(field: TelemetryField): { timestamp: string; value: number | null }[] {
    const data = this.telemetryData();
    const labels = this.timeLabels();
    return data.map((point, index) => ({
      timestamp: labels[index],
      value: point.fields[field] ?? null,
    }));
  }

  getPageSize(rows: number): number {
    const tileHeight = rows * (FIXED_ROW_HEIGHT + MARGIN) - MARGIN;
    const available = tileHeight - TILE_HEADER_HEIGHT - TABLE_HEADER_HEIGHT - PAGINATION_HEIGHT;
    return Math.max(MIN_PAGE_SIZE, Math.floor(available / TABLE_ROW_HEIGHT));
  }

  getTilePage(field: TelemetryField): number {
    return this.tilePages().get(field) ?? 0;
  }

  getTotalPages(field: TelemetryField, rows: number): number {
    const pageSize = this.getPageSize(rows);
    return Math.ceil(this.telemetryData().length / pageSize) || 1;
  }

  nextPage(field: TelemetryField): void {
    const item = this.dashboardItems().find((i) => i.field === field);
    if (!item) return;
    const current = this.getTilePage(field);
    if (current < this.getTotalPages(field, item.rows) - 1) {
      const pages = new Map(this.tilePages());
      pages.set(field, current + 1);
      this.tilePages.set(pages);
    }
  }

  prevPage(field: TelemetryField): void {
    const current = this.getTilePage(field);
    if (current > 0) {
      const pages = new Map(this.tilePages());
      pages.set(field, current - 1);
      this.tilePages.set(pages);
    }
  }

  private clampTilePagesToTotal(): void {
    const items = this.dashboardItems();
    const pages = new Map(this.tilePages());
    let changed = false;
    for (const item of items) {
      if (item.viewMode !== VIEW_MODE_TABLE) continue;
      const total = this.getTotalPages(item.field, item.rows);
      const maxPage = Math.max(0, total - 1);
      const cur = pages.get(item.field) ?? 0;
      if (cur > maxPage) {
        pages.set(item.field, maxPage);
        changed = true;
      }
    }
    if (changed) {
      this.tilePages.set(pages);
    }
  }

  private rebuildDashboardItems(): void {
    const selected = this.selectedFields();
    const existingModes = new Map<TelemetryField, TileViewMode>(
      this.dashboardItems().map((item) => [item.field, item.viewMode]),
    );

    const items: TelemetryDashboardItem[] = selected.map((field, index) => {
      const chartConfig = this.buildChartRowConfig(field, index);
      return {
        x: index % DEFAULT_COLUMNS,
        y: Math.floor(index / DEFAULT_COLUMNS),
        cols: DEFAULT_ITEM_COLS,
        rows: DEFAULT_ITEM_ROWS,
        field,
        chartConfig,
        viewMode: (existingModes.get(field) ?? VIEW_MODE_CHART) as TileViewMode,
      };
    });
    this.dashboardItems.set(items);
  }

  private buildChartRowConfig(field: TelemetryField, index: number): ChartRowConfig {
    const color = COLORS[index % COLORS.length];

    const datasets: ChartDataset<'line'>[] = [{
      label: EnumUtil.getTelemetryFieldDisplay(field),
      data: this.telemetryData().map((point) => point.fields[field] ?? null),
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
      data: { labels: this.timeLabels(), datasets },
      options,
    };
  }

  openMissionDetails(): void {
    const mission = this.missionDetails();
    if (!mission) return;
    this.dialog.open(MissionDetailsDialogComponent, {
      data: { mission },
      autoFocus: false,
    });
  }
}
