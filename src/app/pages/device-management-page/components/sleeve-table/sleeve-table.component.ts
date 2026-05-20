import { Component, ChangeDetectionStrategy, OnInit, effect, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { take } from 'rxjs/operators';
import { DeviceManagerStorageService } from '../../../../services/devices/device-manager-storage.service';
import { SleeveDialogComponent } from '../sleeve-dialog/sleeve-dialog.component';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { SleeveRo } from '../../../../models/Ro/sleeveRo.ro';
import { ClientConstants } from '../../../../common';

const { DeviceServiceAPI, TableConfig, DialogConfig, SnackbarConfig } = ClientConstants;

@Component({
  selector: 'app-sleeve-table',
  standalone: false,
  templateUrl: './sleeve-table.component.html',
  styleUrl: './sleeve-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SleeveTableComponent implements OnInit {
  public readonly sort = viewChild<MatSort>(MatSort);
  public readonly paginator = viewChild<MatPaginator>(MatPaginator);

  public readonly displayedColumns: string[] = [
    'name',
    'location',
    'portNumbers',
    'actions',
  ];
  public readonly dataSource = new MatTableDataSource<SleeveRo>([]);
  public readonly pageSizeOptions = TableConfig.PAGE_SIZE_OPTIONS;

  constructor(
    public readonly deviceManager: DeviceManagerStorageService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
  ) {
    effect(() => {
      this.dataSource.data = this.deviceManager.sleeveList();
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
    this.dataSource.data = this.deviceManager.sleeveList();
    this.dataSource.filterPredicate = (data: SleeveRo, filter: string) => {
      const searchStr = filter.toLowerCase();
      return (
        data.name.toLowerCase().includes(searchStr) ||
        data.portNumbers.some((p) => p.toString().includes(searchStr))
      );
    };
  }

  public onSearch(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.paginator()?.firstPage();
  }

  public onClearSearch(input: HTMLInputElement): void {
    input.value = '';
    this.dataSource.filter = '';
    this.paginator()?.firstPage();
  }

  public onAddSleeve(): void {
    this.dialog
      .open(SleeveDialogComponent, {
        width: DialogConfig.DEVICE_DIALOG_WIDTH,
        data: { mode: 'create', existingSleeves: this.deviceManager.sleeveList() }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (!result) return;
        this.deviceManager
          .createSleeve(result)
          .pipe(take(1))
          .subscribe({
            next: () => this.showToast(DeviceServiceAPI.Messages.SLEEVE_CREATE_SUCCESS),
            error: () => this.showToast(DeviceServiceAPI.Messages.OPERATION_ERROR),
          });
      });
  }

  public onEditSleeve(sleeve: SleeveRo): void {
    this.dialog
      .open(SleeveDialogComponent, {
        width: DialogConfig.DEVICE_DIALOG_WIDTH,
        data: { mode: 'edit', sleeve, existingSleeves: this.deviceManager.sleeveList() }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (!result) return;
        this.deviceManager
          .updateSleeve(sleeve.name, result)
          .pipe(take(1))
          .subscribe({
            next: () => this.showToast(DeviceServiceAPI.Messages.SLEEVE_UPDATE_SUCCESS),
            error: () => this.showToast(DeviceServiceAPI.Messages.OPERATION_ERROR),
          });
      });
  }

  public onDeleteSleeve(sleeve: SleeveRo): void {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: DialogConfig.CONFIRMATION_DIALOG_WIDTH,
        data: {
          title: 'Delete Sleeve',
          message: `Are you sure you want to delete Sleeve "${sleeve.name}"? This action cannot be undone.`,
        },
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.deviceManager
          .deleteSleeve(sleeve.name)
          .pipe(take(1))
          .subscribe({
            next: () => this.showToast(DeviceServiceAPI.Messages.SLEEVE_DELETE_SUCCESS),
            error: () => this.showToast(DeviceServiceAPI.Messages.OPERATION_ERROR),
          });
      });
  }

  public formatLocation(location: {
    latitude: number;
    longitude: number;
    altitude: number;
  }): string {
    return `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`;
  }

  private showToast(message: string): void {
    this.snackBar.open(message, SnackbarConfig.CLOSE_ACTION, {
      duration: SnackbarConfig.DURATION_MS,
      horizontalPosition: SnackbarConfig.HORIZONTAL_POSITION,
      verticalPosition: SnackbarConfig.VERTICAL_POSITION,
    });
  }
}
