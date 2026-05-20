import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { ClientConstants } from '../../../../common/constants/clientConstants.constant';
import type { TimeRangeDialogData, TimeRangeDialogResult } from '../time-range-dialog/time-range-dialog.models';

@Component({
  selector: 'app-mission-time-range-picker',
  standalone: false,
  templateUrl: './mission-time-range-picker.component.html',
  styleUrl: './mission-time-range-picker.component.scss',
})
export class MissionTimeRangePickerComponent {
  readonly investigationUi = ClientConstants.TelemetryInvestigationUi;
  readonly overlayPanelClass = ClientConstants.TelemetryInvestigationUi.TIME_RANGE_OVERLAY_PANEL_CLASS;
  readonly overlayBackdropClass = ClientConstants.TelemetryInvestigationUi.TIME_RANGE_OVERLAY_BACKDROP_CLASS;

  @Input() rangeDisplay = '';
  @Input() isRangeModified = false;
  @Input() open = false;
  @Input() config: TimeRangeDialogData | null = null;

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly applied = new EventEmitter<TimeRangeDialogResult>();
  @Output() readonly resetTimeRange = new EventEmitter<void>();
  @Output() readonly toggleOpen = new EventEmitter<void>();

  readonly overlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];

  onTriggerClick(): void {
    this.toggleOpen.emit();
  }

  onBackdropClick(): void {
    this.closeOverlay();
  }

  onPanelApplied(result: TimeRangeDialogResult): void {
    this.applied.emit(result);
    this.closeOverlay();
  }

  onPanelDismiss(): void {
    this.closeOverlay();
  }

  private closeOverlay(): void {
    if (this.open) {
      this.openChange.emit(false);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.open) {
      return;
    }
    event.preventDefault();
    this.closeOverlay();
  }
}
