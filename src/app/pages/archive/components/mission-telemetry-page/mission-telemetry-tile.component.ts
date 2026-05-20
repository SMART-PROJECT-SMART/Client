import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { Plugin } from 'chart.js';
import { TelemetryField } from '../../../../common/enums';
import { ClientConstants } from '../../../../common/constants/clientConstants.constant';
import type { TelemetryDashboardItem } from '../../../../models/archive';

export type MissionTelemetryTileTableRow = { timestamp: string; value: number | null; trackId: string };

@Component({
  selector: 'app-mission-telemetry-tile',
  standalone: false,
  templateUrl: './mission-telemetry-tile.component.html',
  styleUrl: './mission-telemetry-tile.component.scss',
})
export class MissionTelemetryTileComponent {
  readonly investigationUi = ClientConstants.TelemetryInvestigationUi;

  @Input() item!: TelemetryDashboardItem;
  @Input() viewModeChart = '';
  @Input() tableRows: MissionTelemetryTileTableRow[] = [];
  @Input() crosshairPlugin!: Plugin<'line'>;
  @Input() pageSizeOptions: number[] = [];
  @Input() tilePage = 0;
  @Input() totalPages = 1;
  @Input() rowRangeDisplay = '';
  @Input() selectedPageSize: number | null = null;
  @Input() prevDisabled = false;
  @Input() nextDisabled = false;

  @Output() toggleViewMode = new EventEmitter<TelemetryField>();
  @Output() prevPage = new EventEmitter<TelemetryField>();
  @Output() nextPage = new EventEmitter<TelemetryField>();
  @Output() pageSizeChange = new EventEmitter<{ field: TelemetryField; size: number }>();
}
