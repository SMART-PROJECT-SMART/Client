import { Component, ChangeDetectionStrategy, OnInit, effect, viewChild, inject, input, output, ElementRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActiveMissionRo } from '../../../../models/Ro/activeMissionRo.ro';
import { MissionStatusStorageService } from '../../../../services/mission/mission-status-storage.service';
import { ClientConstants, EnumUtil } from '../../../../common';
import { Priority, UAVType, BaseLocation } from '../../../../common/enums';

const { TableConfig, FormDefaults } = ClientConstants;

function normalizeActiveMissionsFilter(raw: string): string {
  return raw.trim().toLowerCase();
}

@Component({
  selector: 'app-active-missions-table',
  standalone: false,
  templateUrl: './active-missions-table.component.html',
  styleUrl: './active-missions-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveMissionsTableComponent implements OnInit {
  public readonly filterValue = input<string>('');
  public readonly filterValueChange = output<string>();

  public readonly sort = viewChild<MatSort>(MatSort);
  public readonly paginator = viewChild<MatPaginator>(MatPaginator);
  public readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  public readonly displayedColumns: string[] = [
    'tailId',
    'missionTitle',
    'priority',
    'requiredUAVType',
    'location',
    'timeWindow',
  ];
  public readonly dataSource = new MatTableDataSource<ActiveMissionRo>([]);
  public readonly pageSizeOptions = TableConfig.PAGE_SIZE_OPTIONS;

  public readonly missionStatusStorage = inject(MissionStatusStorageService);

  private readonly _dataEffect = effect(() => {
    this.dataSource.data = this.missionStatusStorage.activeMissionList();
  });
  private readonly _sortEffect = effect(() => {
    const sort = this.sort();
    if (sort) this.dataSource.sort = sort;
  });
  private readonly _paginatorEffect = effect(() => {
    const paginator = this.paginator();
    if (paginator) this.dataSource.paginator = paginator;
  });

  private readonly _filterSyncEffect = effect(() => {
    const normalized = normalizeActiveMissionsFilter(this.filterValue());
    this.dataSource.filter = normalized;
    const el = this.searchInput()?.nativeElement;
    if (el && el.value !== normalized) {
      el.value = normalized;
    }
  });

  public ngOnInit(): void {
    this.dataSource.data = this.missionStatusStorage.activeMissionList();
    this.dataSource.sortingDataAccessor = (item: ActiveMissionRo, property: string): string | number => {
      switch (property) {
        case 'tailId': return item.tailId;
        case 'missionTitle': return item.mission.title;
        case 'priority': return this.getPriorityWeight(item.mission.priority);
        case 'requiredUAVType': return item.mission.requiredUAVType;
        case 'location': return item.mission.location.latitude;
        case 'timeWindow': return new Date(item.mission.timeWindow.start).getTime();
        default: return '';
      }
    };
    this.dataSource.filterPredicate = (data: ActiveMissionRo, filter: string) => {
      const searchStr = filter.toLowerCase();
      return (
        data.tailId.toString().includes(searchStr) ||
        data.mission.title.toLowerCase().includes(searchStr) ||
        data.mission.priority.toLowerCase().includes(searchStr) ||
        data.mission.requiredUAVType.toLowerCase().includes(searchStr)
      );
    };
  }

  public onFilterInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.filterValueChange.emit(normalizeActiveMissionsFilter(raw));
    this.paginator()?.firstPage();
  }

  public onClearSearch(input: HTMLInputElement): void {
    input.value = FormDefaults.EMPTY_STRING;
    this.filterValueChange.emit(FormDefaults.EMPTY_STRING);
    this.paginator()?.firstPage();
  }

  public getPriorityDisplay(priority: Priority): string {
    return EnumUtil.getPriorityDisplay(priority);
  }

  public getUAVTypeDisplay(uavType: UAVType): string {
    return EnumUtil.getUAVTypeDisplay(uavType);
  }

  public formatLocation(location: { latitude: number; longitude: number; altitude: number }): string {
    const baseName = ClientConstants.BaseLocationConfig.getBaseFromCoordinates(location);
    if (baseName) {
      return EnumUtil.getBaseLocationDisplay(baseName as BaseLocation);
    }
    return `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`;
  }

  public formatTimeWindow(start: Date, end: Date): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const timeFormat: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    return `${startDate.toLocaleTimeString([], timeFormat)} - ${endDate.toLocaleTimeString([], timeFormat)}`;
  }

  private getPriorityWeight(priority: Priority): number {
    const weights: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
    return weights[priority] ?? 3;
  }
}
