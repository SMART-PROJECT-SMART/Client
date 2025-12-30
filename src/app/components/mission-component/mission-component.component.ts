import { Component, output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UAVType } from '../../enums/uavType.enum';
import { Priority } from '../../enums/priority.enum';

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
    missionId: new FormControl('', [Validators.required]),
    requiredUAVType: new FormControl('', [Validators.required]),
    priority: new FormControl('', [Validators.required]),
    location: new FormGroup({
      latitude: new FormControl(0, [Validators.required, Validators.min(-90), Validators.max(90)]),
      longitude: new FormControl(0, [
        Validators.required,
        Validators.min(-180),
        Validators.max(180),
      ]),
      altitude: new FormControl(0, [Validators.required]),
    }),
    timeWindow: new FormGroup({
      startTime: new FormGroup({
        hours: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(23)]),
        minutes: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(59)]),
        seconds: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(59)]),
      }),
      endTime: new FormGroup({
        hours: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(23)]),
        minutes: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(59)]),
        seconds: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(59)]),
      }),
    }),
  });

  public onRemove(): void {
    this.remove.emit();
  }
}
