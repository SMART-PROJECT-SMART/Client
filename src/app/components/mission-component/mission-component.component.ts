import { Component, output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UAVType, Priority } from '../../enums';
import { ClientConstants } from '../../common';

const { LocationValidation, TimeValidation } = ClientConstants.ValidationConstants;
const { EMPTY_STRING, DEFAULT_NUMBER } = ClientConstants.FormDefaults;

@Component({
  selector: 'app-mission-component',
  standalone: false,
  templateUrl: './mission-component.component.html',
  styleUrl: './mission-component.component.scss',
})
export class MissionComponentComponent {
  public readonly uavTypes = Object.values(UAVType);
  public readonly priority = Object.values(Priority);
  public readonly remove = output<void>();

  public missionForm = new FormGroup({
    missionId: new FormControl(EMPTY_STRING, [Validators.required]),
    requiredUAVType: new FormControl(EMPTY_STRING, [Validators.required]),
    priority: new FormControl(EMPTY_STRING, [Validators.required]),
    location: this.createLocationFormGroup(),
    timeWindow: this.createTimeWindowFormGroup(),
  });

  public onRemove(): void {
    this.remove.emit();
  }

  private createLocationFormGroup(): FormGroup {
    return new FormGroup({
      latitude: new FormControl(DEFAULT_NUMBER, [
        Validators.required,
        Validators.min(LocationValidation.LATITUDE_MIN),
        Validators.max(LocationValidation.LATITUDE_MAX),
      ]),
      longitude: new FormControl(DEFAULT_NUMBER, [
        Validators.required,
        Validators.min(LocationValidation.LONGITUDE_MIN),
        Validators.max(LocationValidation.LONGITUDE_MAX),
      ]),
      altitude: new FormControl(DEFAULT_NUMBER, [Validators.required]),
    });
  }

  private createTimeWindowFormGroup(): FormGroup {
    return new FormGroup({
      startTime: this.createTimeFormGroup(),
      endTime: this.createTimeFormGroup(),
    });
  }

  private createTimeFormGroup(): FormGroup {
    return new FormGroup({
      hours: new FormControl(DEFAULT_NUMBER, [
        Validators.required,
        Validators.min(TimeValidation.HOURS_MIN),
        Validators.max(TimeValidation.HOURS_MAX),
      ]),
      minutes: new FormControl(DEFAULT_NUMBER, [
        Validators.required,
        Validators.min(TimeValidation.MINUTES_MIN),
        Validators.max(TimeValidation.MINUTES_MAX),
      ]),
      seconds: new FormControl(DEFAULT_NUMBER, [
        Validators.required,
        Validators.min(TimeValidation.SECONDS_MIN),
        Validators.max(TimeValidation.SECONDS_MAX),
      ]),
    });
  }
}
