import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ClientConstants } from '../../common/constants/clientConstants.constant';
import { timeWindowValidator } from '../../common/validators';
import type { Mission, MissionFormGroups } from '../../models';

const { LocationValidation } = ClientConstants.ValidationConstants;

@Injectable({
  providedIn: 'root',
})
export class MissionFormFactory {
  public createEmptyForms(): MissionFormGroups {
    return {
      basicInfoForm: this.createBasicInfoForm(),
      timeWindowForm: this.createTimeWindowForm(),
      locationForm: this.createLocationForm(),
    };
  }

  public createFormsWithMission(mission: Mission): MissionFormGroups {
    return {
      basicInfoForm: this.createBasicInfoForm(mission),
      timeWindowForm: this.createTimeWindowForm(mission),
      locationForm: this.createLocationForm(mission),
    };
  }

  private createBasicInfoForm(mission?: Mission): FormGroup {
    return new FormGroup({
      title: new FormControl(mission?.title ?? '', [Validators.required]),
      requiredUAVType: new FormControl(mission?.requiredUAVType ?? '', [Validators.required]),
      priority: new FormControl(mission?.priority ?? '', [Validators.required]),
    });
  }

  private createTimeWindowForm(mission?: Mission): FormGroup {
    const startValue = mission ? this.formatDateForInput(mission.timeWindow.start) : '';
    const endValue = mission ? this.formatDateForInput(mission.timeWindow.end) : '';

    return new FormGroup(
      {
        start: new FormControl(startValue, [Validators.required]),
        end: new FormControl(endValue, [Validators.required]),
      },
      { validators: timeWindowValidator() }
    );
  }

  private createLocationForm(mission?: Mission): FormGroup {
    return new FormGroup({
      latitude: new FormControl<number | null>(mission?.location.latitude ?? null, [
        Validators.required,
        Validators.min(LocationValidation.LATITUDE_MIN),
        Validators.max(LocationValidation.LATITUDE_MAX),
      ]),
      longitude: new FormControl<number | null>(mission?.location.longitude ?? null, [
        Validators.required,
        Validators.min(LocationValidation.LONGITUDE_MIN),
        Validators.max(LocationValidation.LONGITUDE_MAX),
      ]),
      altitude: new FormControl<number | null>(mission?.location.altitude ?? null, [Validators.required]),
    });
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
