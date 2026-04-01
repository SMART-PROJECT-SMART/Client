import { Component, ElementRef, EventEmitter, Input, Output, viewChild } from '@angular/core';
import type { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { TelemetryField } from '../../../../common/enums';
import { EnumUtil } from '../../../../common/utils';
import { ClientConstants } from '../../../../common/constants/clientConstants.constant';

@Component({
  selector: 'app-mission-telemetry-investigation-toolbar',
  standalone: false,
  templateUrl: './mission-telemetry-investigation-toolbar.component.html',
  styleUrl: './mission-telemetry-investigation-toolbar.component.scss',
})
export class MissionTelemetryInvestigationToolbarComponent {
  readonly investigationUi = ClientConstants.TelemetryInvestigationUi;

  private readonly paramSearchInputRef = viewChild<ElementRef<HTMLInputElement>>('paramSearchInput');

  @Input() showParameterSearch = false;
  @Input() parameterSearch = '';
  @Input() filteredUnselectedFields: TelemetryField[] = [];
  @Input() selectedFields: TelemetryField[] = [];
  @Input() showTimeRangeControls = false;
  @Input() rangeDisplay = '';
  @Input() isRangeModified = false;

  @Output() parameterSearchInput = new EventEmitter<Event>();
  @Output() parameterSelected = new EventEmitter<{
    event: MatAutocompleteSelectedEvent;
    input: HTMLInputElement;
  }>();
  @Output() removeField = new EventEmitter<TelemetryField>();
  @Output() openRangePicker = new EventEmitter<void>();
  @Output() resetTimeRange = new EventEmitter<void>();

  getFieldLabel(field: TelemetryField): string {
    return EnumUtil.getTelemetryFieldDisplay(field);
  }

  onParameterSearchInput(event: Event): void {
    this.parameterSearchInput.emit(event);
  }

  onParameterSelected(event: MatAutocompleteSelectedEvent, input: HTMLInputElement): void {
    this.parameterSelected.emit({ event, input });
  }

  focusSearchInput(): void {
    this.paramSearchInputRef()?.nativeElement.focus();
  }
}
