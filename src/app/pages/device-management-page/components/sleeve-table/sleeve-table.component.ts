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

const { DeviceServiceAPI, TableConfig } = ClientConstants;

@Component({
  selector: 'app-sleeve-table',
  standalone: false,
  templateUrl: './sleeve-table.component.html',
  styleUrl: './sleeve-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SleeveTableComponent implements OnInit {
  public readonly sort = viewChild.required<MatSort>(MatSort);
  public readonly paginator = viewChild.required<MatPaginator>(MatPaginator);

  public readonly displayedColumns: string[] = ['name', 'location', 'portNumbers', 'assignedToTailId', 'actions'];
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
  }

  public ngOnInit(): void {
    setTimeout(() => {
      this.dataSource.sort = this.sort();
      this.dataSource.paginator = this.paginator();
      this.dataSource.filterPredicate = (data: SleeveRo, filter: string) => {
        const searchStr = filter.toLowerCase();
        return (
          data.name.toLowerCase().includes(searchStr) ||
          data.portNumbers.some((p) => p.toString().includes(searchStr))
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

  public onAddSleeve(): void {
    this.dialog
      .open(SleeveDialogComponent, { width: '500px', data: { mode: 'create' } })
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (!result) return;
        this.deviceManager.createSleeve(result).pipe(take(1)).subscribe({
          next: () => this.showToast(DeviceServiceAPI.Messages.SLEEVE_CREATE_SUCCESS),
          error: () => this.showToast(DeviceServiceAPI.Messages.OPERATION_ERROR),
        });
      });
  }

  public onEditSleeve(sleeve: SleeveRo): void {
    this.dialog
      .open(SleeveDialogComponent, { width: '500px', data: { mode: 'edit', sleeve } })
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (!result) return;
        this.deviceManager.updateSleeve(sleeve.name, result).pipe(take(1)).subscribe({
          next: () => this.showToast(DeviceServiceAPI.Messages.SLEEVE_UPDATE_SUCCESS),
          error: () => this.showToast(DeviceServiceAPI.Messages.OPERATION_ERROR),
        });
      });
  }

  public onDeleteSleeve(sleeve: SleeveRo): void {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '400px',
        data: {
          title: 'Delete Sleeve',
          message: `Are you sure you want to delete Sleeve "${sleeve.name}"? This action cannot be undone.`,
        },
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.deviceManager.deleteSleeve(sleeve.name).pipe(take(1)).subscribe({
          next: () => this.showToast(DeviceServiceAPI.Messages.SLEEVE_DELETE_SUCCESS),
          error: () => this.showToast(DeviceServiceAPI.Messages.OPERATION_ERROR),
        });
      });
  }

  public formatLocation(location: { latitude: number; longitude: number; altitude: number }): string {
    return `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°, ${location.altitude}m`;
  }

  private showToast(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000, horizontalPosition: 'center', verticalPosition: 'top' });
  }
}
