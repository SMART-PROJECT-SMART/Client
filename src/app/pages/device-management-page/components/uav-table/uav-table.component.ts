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

const { DeviceServiceAPI, TableConfig, BaseLocationConfig } = ClientConstants;

@Component({
  selector: 'app-uav-table',
  standalone: false,
  templateUrl: './uav-table.component.html',
  styleUrl: './uav-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UavTableComponent implements OnInit {
  public readonly sort = viewChild.required<MatSort>(MatSort);
  public readonly paginator = viewChild.required<MatPaginator>(MatPaginator);

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
  }

  public ngOnInit(): void {
    setTimeout(() => {
      this.dataSource.sort = this.sort();
      this.dataSource.paginator = this.paginator();
      this.dataSource.filterPredicate = (data: UAVRo, filter: string) => {
        const searchStr = filter.toLowerCase();
        return (
          data.tailId.toString().includes(searchStr) ||
          data.platformType.toLowerCase().includes(searchStr)
        );
      };
    });
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
      .open(UAVDialogComponent, { width: '500px', data: { mode: 'create' } })
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
      .open(UAVDialogComponent, { width: '500px', data: { mode: 'edit', uav } })
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
        width: '400px',
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
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
