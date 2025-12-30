import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
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

  public missionForm = new FormGroup({
    missionId: new FormControl(''),
    requiredUAVType: new FormControl(''),
    priority: new FormControl(''),
    location: new FormGroup({
      latitude: new FormControl(0),
      longitude: new FormControl(0),
      altitude: new FormControl(0),
    }),
    timeWindow: new FormGroup({
      startTime: new FormGroup({
        hours: new FormControl(0),
        minutes: new FormControl(0),
        seconds: new FormControl(0),
      }),
      endTime: new FormGroup({
        hours: new FormControl(0),
        minutes: new FormControl(0),
        seconds: new FormControl(0),
      }),
    }),
  });

  public onRemove(): void {}
}
