import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ClientConstants } from '../../../../common/constants/clientConstants.constant';

@Component({
  selector: 'app-mission-telemetry-page-header',
  standalone: false,
  templateUrl: './mission-telemetry-page-header.component.html',
  styleUrl: './mission-telemetry-page-header.component.scss',
})
export class MissionTelemetryPageHeaderComponent {
  readonly investigationUi = ClientConstants.TelemetryInvestigationUi;

  @Input() missionTitle = '';
  @Input() tailId = 0;
  @Input() hasMissionDetails = false;

  @Output() back = new EventEmitter<void>();
  @Output() openMissionDetails = new EventEmitter<void>();
}
