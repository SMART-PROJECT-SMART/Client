import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, OnDestroy, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import type { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { GridType, CompactType } from 'angular-gridster2';
import type { GridsterConfig } from 'angular-gridster2';
import type { Plugin } from 'chart.js';
import { TelemetryField } from '../../../../common/enums';
import { EnumUtil } from '../../../../common/utils';
import { ClientConstants } from '../../../../common/constants/clientConstants.constant';
import { createCrosshairPlugin } from '../../../../common/utils/crosshair-plugin.util';
import { ArchiveApiService } from '../../../../services/archive/archive-api.service';
import { MissionTelemetryFetchService } from '../../../../services/archive/mission-telemetry-fetch.service';
import { MissionDetailsDialogComponent } from '../mission-details-dialog/mission-details-dialog.component';
import type { TimeRangeDialogData, TimeRangeDialogResult } from '../time-range-dialog/time-range-dialog.models';
import type {
  ArchiveMissionRo,
  MissionTelemetryRo,
  TelemetryDashboardItem,
  TelemetryTimeRangeBounds,
  TileViewMode,
} from '../../../../models/archive';
import { MissionTelemetryInvestigationToolbarComponent } from './mission-telemetry-investigation-toolbar.component';
import {
  clampMillisecondsIntervalToTelemetryBounds,
  telemetryBoundsHasSamples,
} from '../../utils/mission-telemetry-time-range.util';
import { buildTelemetryChartRowConfig } from '../../utils/mission-telemetry-chart.util';
import {
  formatTelemetryBoundsDateDisplayUtc,
  isoTimestampToDatetimeLocalValue,
} from '../../utils/mission-telemetry-datetime.util';
import { mergeMissionTelemetryRows } from '../../utils/mission-telemetry-merge.util';

const { LOCALE, OPTIONS: TIME_FORMAT_OPTIONS } = ClientConstants.TimeFormat;

const { DEFAULT_COLUMNS, DEFAULT_ITEM_COLS, DEFAULT_ITEM_ROWS, FIXED_ROW_HEIGHT,
  MARGIN, MIN_ITEM_COLS, MIN_ITEM_ROWS, DRAG_HANDLE_CLASS, NO_DRAG_CLASS,
  VIEW_MODE_CHART, VIEW_MODE_TABLE,
  TILE_HEADER_HEIGHT, TABLE_HEADER_HEIGHT, PAGINATION_HEIGHT, TABLE_ROW_HEIGHT, MIN_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} = ClientConstants.GridsterDashboard;

const { NO_MISSION_ID, LOAD_FAILED } = ClientConstants.TelemetryPageMessages;
const { ARCHIVE } = ClientConstants.ArchiveRoutes;
const { MISSION_ID: MISSION_ID_PARAM, TAIL_ID: TAIL_ID_PARAM } = ClientConstants.TelemetryQueryParams;
const {
  TABLE_ROW_TRACK_ID_SEPARATOR,
  ROW_RANGE_ZERO_ROWS,
  BOUNDS_DISPLAY_RANGE_SEPARATOR,
} = ClientConstants.TelemetryInvestigationUi;

const MILLISECONDS_PER_SECOND = 1000;

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
  private readonly missionTelemetryFetch = inject(MissionTelemetryFetchService);

  readonly investigationUi = ClientConstants.TelemetryInvestigationUi;

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
  readonly tilePageSizes = signal<Map<TelemetryField, number>>(new Map());
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly viewModeChart = VIEW_MODE_CHART;
  readonly fromInput = signal<string>('');
  readonly toInput = signal<string>('');
  readonly activeStartTime = signal<string>('');
  readonly activeEndTime = signal<string>('');
  readonly originalBounds = signal<TelemetryTimeRangeBounds | null>(null);
  private readonly telemetryMissionBounds = signal<TelemetryTimeRangeBounds | null>(null);
  readonly timeRangeOverlayOpen = signal(false);
  readonly timeRangePickerConfig = signal<TimeRangeDialogData | null>(null);

  private readonly investigationToolbar = viewChild(MissionTelemetryInvestigationToolbarComponent);

  private missionId = '';
  private readonly telemetryData = signal<MissionTelemetryRo[]>([]);
  private readonly fetchTrigger$ = new Subject<{ fieldsToFetch: TelemetryField[]; fullReload: boolean }>();
  private readonly destroy$ = new Subject<void>();
  private loadedFields = new Set<TelemetryField>();

  private readonly viewTelemetry = computed<MissionTelemetryRo[]>(() => {
    const raw = this.telemetryData();
    const start = this.activeStartTime();
    const end = this.activeEndTime();
    if (!start && !end) return raw;
    const startMs = start ? new Date(start).getTime() : null;
    const endMs = end ? new Date(end).getTime() : null;
    return raw.filter((p) => {
      const t = new Date(p.timestamp).getTime();
      if (startMs !== null && t < startMs) return false;
      if (endMs !== null && t > endMs) return false;
      return true;
    });
  });

  private readonly timeLabels = computed<string[]>(() =>
    this.viewTelemetry().map((point) =>
      new Date(point.timestamp).toLocaleTimeString(LOCALE, TIME_FORMAT_OPTIONS),
    ),
  );

  readonly tableRowsByField = computed(() => {
    this.viewTelemetry();
    this.timeLabels();
    this.tilePageSizes();
    const items = this.dashboardItems();
    const pages = this.tilePages();
    const map = new Map<TelemetryField, TelemetryTableRowView[]>();
    for (const item of items) {
      if (item.viewMode !== VIEW_MODE_TABLE) continue;
      const field = item.field;
      const pageSize = this.getEffectivePageSize(field, item.rows);
      const page = pages.get(field) ?? 0;
      const start = page * pageSize;
      const allData = this.getFieldTableData(field);
      const sliced = allData.slice(start, start + pageSize).map((row, i) => ({
        ...row,
        trackId: `${String(field)}${TABLE_ROW_TRACK_ID_SEPARATOR}${start + i}`,
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

  readonly missionTelemetryWindow = computed<TelemetryTimeRangeBounds | null>(() => {
    const fromApi = this.telemetryMissionBounds();
    if (fromApi) {
      return fromApi;
    }
    return this.originalBounds();
  });

  readonly isRangeModified = computed<boolean>(() => {
    const bounds = this.missionTelemetryWindow();
    if (!bounds) return false;
    const start = this.activeStartTime();
    const end = this.activeEndTime();
    if (!start || !end) return false;
    const toSec = (iso: string) => Math.floor(new Date(iso).getTime() / MILLISECONDS_PER_SECOND);
    return (
      toSec(start) !== toSec(bounds.first) || toSec(end) !== toSec(bounds.last)
    );
  });

  readonly boundsDisplay = computed<string>(() => {
    const bounds = this.missionTelemetryWindow();
    if (!bounds) return '';
    return `${formatTelemetryBoundsDateDisplayUtc(bounds.first)} \u2014 ${formatTelemetryBoundsDateDisplayUtc(bounds.last)}`;
  });

  readonly rangeDisplay = computed<string>(() => {
    const from = this.fromInput();
    const to = this.toInput();
    if (!from || !to) return '';
    return `${formatTelemetryBoundsDateDisplayUtc(new Date(from).toISOString())} \u2014 ${formatTelemetryBoundsDateDisplayUtc(new Date(to).toISOString())}`;
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    this.missionId = params[MISSION_ID_PARAM] ?? '';
    this.tailId.set(Number(params[TAIL_ID_PARAM]) || 0);

    if (!this.missionId) {
      this.errorMessage.set(NO_MISSION_ID);
      return;
    }

    const allFields = Object.values(TelemetryField).filter((f) => !NON_GRAPHABLE_FIELDS.has(f));
    this.availableFields.set(allFields);

    this.subscribeMissionAndTelemetryBounds();

    this.subscribeTelemetryFetchPipeline();
  }

  private subscribeMissionAndTelemetryBounds(): void {
    forkJoin({
      mission: this.archiveApi.getMissionById(this.missionId).pipe(catchError(() => of(null))),
      bounds: this.archiveApi.getMissionTelemetryBounds(this.missionId, this.tailId()).pipe(
        catchError(() => of(null)),
      ),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ mission, bounds }) => {
          if (mission) {
            this.missionDetails.set(mission);
            this.missionTitle.set(mission.title ?? '');
          } else {
            this.missionDetails.set(null);
            this.missionTitle.set('');
          }
          if (telemetryBoundsHasSamples(bounds)) {
            const first = bounds.firstTimestamp;
            const last = bounds.lastTimestamp;
            const window = { first, last };
            this.originalBounds.set(window);
            this.telemetryMissionBounds.set(window);
            this.fromInput.set(isoTimestampToDatetimeLocalValue(first));
            this.toInput.set(isoTimestampToDatetimeLocalValue(last));
          }
        },
      });
  }

  private subscribeTelemetryFetchPipeline(): void {
    this.fetchTrigger$
      .pipe(
        switchMap(({ fieldsToFetch, fullReload }) => {
          if (fullReload) {
            this.loadedFields.clear();
            this.telemetryData.set([]);
            this.tilePages.set(new Map());
          }

          const selected = this.selectedFields();
          if (selected.length === 0) {
            this.telemetryData.set([]);
            this.dashboardItems.set([]);
            this.loadedFields.clear();
            this.fetchingData.set(false);
            return [];
          }

          const newFields = fullReload ? selected : fieldsToFetch.filter((f) => !this.loadedFields.has(f));
          if (newFields.length === 0) {
            this.rebuildDashboardItems();
            return [];
          }

          this.fetchingData.set(true);
          this.errorMessage.set('');
          return this.missionTelemetryFetch.fetchTelemetryRows(
            this.missionId,
            this.tailId(),
            newFields,
            this.fromInput(),
            this.toInput(),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (data: MissionTelemetryRo[]) => {
          const merged = mergeMissionTelemetryRows(this.telemetryData(), data);
          this.telemetryData.set(merged);

          if (!this.originalBounds() && data.length > 0) {
            const first = data[0].timestamp;
            const last = data[data.length - 1].timestamp;
            this.originalBounds.set({ first, last });
            this.fromInput.set(isoTimestampToDatetimeLocalValue(first));
            this.toInput.set(isoTimestampToDatetimeLocalValue(last));
          }

          for (const point of data) {
            for (const key of Object.keys(point.fields)) {
              this.loadedFields.add(key as TelemetryField);
            }
          }

          this.rebuildDashboardItems();
          this.clampTilePagesToTotal();
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
    this.rebuildDashboardItems();
    this.fetchTrigger$.next({ fieldsToFetch: [field], fullReload: false });
  }

  removeField(field: TelemetryField): void {
    this.selectedFields.set(this.selectedFields().filter((f) => f !== field));
    const pages = new Map(this.tilePages());
    pages.delete(field);
    this.tilePages.set(pages);
    const sizes = new Map(this.tilePageSizes());
    sizes.delete(field);
    this.tilePageSizes.set(sizes);
    this.rebuildDashboardItems();
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
    this.investigationToolbar()?.focusSearchInput();
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
    const data = this.viewTelemetry();
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

  getEffectivePageSize(field: TelemetryField, rows: number): number {
    return this.tilePageSizes().get(field) ?? this.getPageSize(rows);
  }

  getTilePageSize(field: TelemetryField): number | null {
    return this.tilePageSizes().get(field) ?? null;
  }

  setTilePageSize(field: TelemetryField, size: number): void {
    const sizes = new Map(this.tilePageSizes());
    if (size > 0) {
      sizes.set(field, size);
    } else {
      sizes.delete(field);
    }
    this.tilePageSizes.set(sizes);
    const pages = new Map(this.tilePages());
    pages.set(field, 0);
    this.tilePages.set(pages);
    this.clampTilePagesToTotal();
  }

  getTilePage(field: TelemetryField): number {
    return this.tilePages().get(field) ?? 0;
  }

  getTotalPages(field: TelemetryField, rows: number): number {
    const pageSize = this.getEffectivePageSize(field, rows);
    return Math.ceil(this.viewTelemetry().length / pageSize) || 1;
  }

  getRowRangeDisplay(field: TelemetryField, rows: number): string {
    const total = this.viewTelemetry().length;
    if (total === 0) return ROW_RANGE_ZERO_ROWS;
    const pageSize = this.getEffectivePageSize(field, rows);
    const page = this.getTilePage(field);
    const start = page * pageSize + 1;
    const end = Math.min(start + pageSize - 1, total);
    return `${start}\u2013${end} of ${total}`;
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
      const chartConfig = buildTelemetryChartRowConfig({
        field,
        colorIndex: index,
        viewTelemetry: this.viewTelemetry(),
        timeLabels: this.timeLabels(),
      });
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

  onTimeRangeToggle(): void {
    if (this.timeRangeOverlayOpen()) {
      this.timeRangeOverlayOpen.set(false);
      this.timeRangePickerConfig.set(null);
      return;
    }
    const bounds = this.missionTelemetryWindow();
    if (!bounds) return;
    let from = this.fromInput();
    let to = this.toInput();
    if (!from || !to) {
      from = isoTimestampToDatetimeLocalValue(bounds.first);
      to = isoTimestampToDatetimeLocalValue(bounds.last);
      this.fromInput.set(from);
      this.toInput.set(to);
    }

    const seed = clampMillisecondsIntervalToTelemetryBounds(new Date(from).getTime(), new Date(to).getTime(), bounds);

    const data: TimeRangeDialogData = {
      from: new Date(seed.fromMs),
      to: new Date(seed.toMs),
      boundsDisplay: `${formatTelemetryBoundsDateDisplayUtc(bounds.first)} ${BOUNDS_DISPLAY_RANGE_SEPARATOR} ${formatTelemetryBoundsDateDisplayUtc(bounds.last)}`,
      minBound: new Date(bounds.first),
      maxBound: new Date(bounds.last),
      useUtcCalendar: true,
    };

    this.timeRangePickerConfig.set(data);
    this.timeRangeOverlayOpen.set(true);
  }

  onTimeRangeOpenChange(open: boolean): void {
    this.timeRangeOverlayOpen.set(open);
    if (!open) {
      this.timeRangePickerConfig.set(null);
    }
  }

  onTimeRangeApplied(result: TimeRangeDialogResult): void {
    this.fromInput.set(isoTimestampToDatetimeLocalValue(result.from.toISOString()));
    this.toInput.set(isoTimestampToDatetimeLocalValue(result.to.toISOString()));
    this.activeStartTime.set(result.from.toISOString());
    this.activeEndTime.set(result.to.toISOString());
    this.rebuildDashboardItems();
    this.clampTilePagesToTotal();
  }

  resetTimeRange(): void {
    const bounds = this.missionTelemetryWindow();
    if (!bounds) return;
    this.fromInput.set(isoTimestampToDatetimeLocalValue(bounds.first));
    this.toInput.set(isoTimestampToDatetimeLocalValue(bounds.last));
    this.activeStartTime.set('');
    this.activeEndTime.set('');
    this.rebuildDashboardItems();
    this.clampTilePagesToTotal();
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
