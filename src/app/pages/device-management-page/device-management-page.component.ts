import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { DeviceManagerStorageService } from '../../services/devices/device-manager-storage.service';

@Component({
  selector: 'app-device-management-page',
  standalone: false,
  templateUrl: './device-management-page.component.html',
  styleUrl: './device-management-page.component.scss',
})
export class DeviceManagementPageComponent implements OnDestroy, OnInit {
  private readonly destroy$: Subject<void> = new Subject<void>();
  public readonly selectedTabIndex = signal<number>(0);
  constructor(public readonly deviceManagerStorage: DeviceManagerStorageService) {}
  public ngOnInit(): void {
    this.deviceManagerStorage.loadUAVs().pipe(takeUntil(this.destroy$)).subscribe();
    this.deviceManagerStorage.loadSleeves().pipe(takeUntil(this.destroy$)).subscribe();
  }
  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  public onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }
}
