import { Component, ChangeDetectionStrategy, OnInit, effect, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { take } from 'rxjs/operators';
import { DeviceManagerStorageService } from '../../../../services/devices/device-manager-storage.service';
import { UAVDialogComponent } from '../uavdialog/uavdialog.component';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { UAVRo } from '../../../../models/Ro/uavRO.ro';
import { ClientConstants, EnumUtil } from '../../../../common';
import { PlatformType, BaseLocation } from '../../../../common/enums';

const { DeviceServiceAPI, TableConfig, BaseLocationConfig, DialogConfig, SnackbarConfig } = ClientConstants;

@Component({
  selector: 'app-uav-table',
  standalone: false,
  templateUrl: './uav-table.component.html',
  styleUrl: './uav-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UavTableComponent implements OnInit {
  public readonly sort = viewChild<MatSort>(MatSort);
  public readonly paginator = viewChild<MatPaginator>(MatPaginator);

  public readonly displayedColumns: string[] = [
    'tailId',
    'platformType',
    'baseLocation',
    'actions',
  ];
  public readonly dataSource = new MatTableDataSource<UAVRo>([]);
  public readonly pageSizeOptions = TableConfig.PAGE_SIZE_OPTIONS;

  constructor(
    public readonly deviceManager: DeviceManagerStorageService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
  ) {
    effect(() => {
      this.dataSource.data = this.deviceManager.uavList();
    });
    effect(() => {
      const sort = this.sort();
      if (sort) this.dataSource.sort = sort;
    });
    effect(() => {
      const paginator = this.paginator();
      if (paginator) this.dataSource.paginator = paginator;
    });
  }

  public ngOnInit(): void {
    this.dataSource.data = this.deviceManager.uavList();
    this.dataSource.filterPredicate = (data: UAVRo, filter: string) => {
      const searchStr = filter.toLowerCase();
      const baseName = this.formatLocation(data.baseLocation).toLowerCase();
      return (
        data.tailId.toString().includes(searchStr) ||
        data.platformType.toLowerCase().includes(searchStr) ||
        baseName.includes(searchStr)
      );
    };
  }

  public onSearch(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  public onClearSearch(input: HTMLInputElement): void {
    input.value = '';
    this.dataSource.filter = '';
  }

  public onAddUAV(): void {
    this.dialog
      .open(UAVDialogComponent, {
        width: DialogConfig.DEVICE_DIALOG_WIDTH,
        data: { mode: 'create', existingUAVs: this.deviceManager.uavList() }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (!result) return;
        this.deviceManager
          .createUAV(result)
          .pipe(take(1))
          .subscribe({
            next: () => this.showToast(DeviceServiceAPI.Messages.UAV_CREATE_SUCCESS),
            error: () => this.showToast(DeviceServiceAPI.Messages.OPERATION_ERROR),
          });
      });
  }

  public onEditUAV(uav: UAVRo): void {
    this.dialog
      .open(UAVDialogComponent, {
        width: DialogConfig.DEVICE_DIALOG_WIDTH,
        data: { mode: 'edit', uav, existingUAVs: this.deviceManager.uavList() }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (!result) return;
        this.deviceManager
          .updateUAV(uav.tailId, result)
          .pipe(take(1))
          .subscribe({
            next: () => this.showToast(DeviceServiceAPI.Messages.UAV_UPDATE_SUCCESS),
            error: () => this.showToast(DeviceServiceAPI.Messages.OPERATION_ERROR),
          });
      });
  }

  public onDeleteUAV(uav: UAVRo): void {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: DialogConfig.CONFIRMATION_DIALOG_WIDTH,
        data: {
          title: 'Delete UAV',
          message: `Are you sure you want to delete UAV with Tail ID ${uav.tailId}? This action cannot be undone.`,
        },
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.deviceManager
          .deleteUAV(uav.tailId)
          .pipe(take(1))
          .subscribe({
            next: () => this.showToast(DeviceServiceAPI.Messages.UAV_DELETE_SUCCESS),
            error: () => this.showToast(DeviceServiceAPI.Messages.OPERATION_ERROR),
          });
      });
  }

  public formatLocation(location: {
    latitude: number;
    longitude: number;
    altitude: number;
  }): string {
    const baseName = BaseLocationConfig.getBaseFromCoordinates(location);
    if (baseName) {
      return EnumUtil.getBaseLocationDisplay(baseName as BaseLocation);
    }
    return `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`;
  }

  public getPlatformTypeDisplay(platformType: PlatformType | number): string {
    return EnumUtil.getPlatformTypeDisplay(platformType);
  }

  private showToast(message: string): void {
    this.snackBar.open(message, SnackbarConfig.CLOSE_ACTION, {
      duration: SnackbarConfig.DURATION_MS,
      horizontalPosition: SnackbarConfig.HORIZONTAL_POSITION,
      verticalPosition: SnackbarConfig.VERTICAL_POSITION,
    });
  }
}
