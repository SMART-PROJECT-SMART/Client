import { Component, input, InputSignal, ChangeDetectionStrategy } from '@angular/core';
import { UAVDisplay } from '../../../../models/uav/uavDisplay.model';

@Component({
  selector: 'app-uav-option-component',
  standalone: false,
  templateUrl: './uav-option-component.component.html',
  styleUrl: './uav-option-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UavOptionComponentComponent {
  public uavDisplay: InputSignal<UAVDisplay> = input.required<UAVDisplay>();
}
