import { Component, EventEmitter, Output, QueryList, ViewChildren } from '@angular/core';
import { ClientConstants } from '../../common';
import { MissionComponentComponent } from '../mission-component/mission-component.component';
import { Mission } from '../../models/mission.model';

const { ADD_MISSION_LABEL, SUBMIT_LABEL } = ClientConstants.AssignmentPageConstants;

@Component({
  selector: 'app-assignment-management-component',
  standalone: false,
  templateUrl: './assignment-management-component.html',
  styleUrl: './assignment-management-component.scss',
})
export class AssignmentManagementComponent {
  @ViewChildren(MissionComponentComponent)
  public missionComponents!: QueryList<MissionComponentComponent>;

  @Output()
  public missionsSubmit = new EventEmitter<Mission[]>();

  public readonly addMissionLabel = ADD_MISSION_LABEL;
  public readonly submitLabel = SUBMIT_LABEL;
  public missionIds: number[] = [];

  private nextMissionId = 0;

  public onAddMission(): void {
    this.missionIds.push(this.nextMissionId++);
  }

  public onRemoveMission(missionId: number): void {
    this.missionIds = this.missionIds.filter((id) => id !== missionId);
  }

  public onSubmit(): void {
    const missions = this.missionComponents.map((component) => {
      const formValue = component.missionForm.value;
      return {
        id: formValue.missionId!,
        requiredUAVType: formValue.requiredUAVType!,
        missionPriority: formValue.priority!,
        location: formValue.location!,
        timeWindow: formValue.timeWindow!,
      } as Mission;
    });
    this.missionsSubmit.emit(missions);
  }

  public get isSubmitDisabled(): boolean {
    if (this.missionIds.length === 0) {
      return true;
    }

    return this.missionComponents?.some((component) => component.missionForm.invalid) ?? true;
  }

  public trackByMissionId(_index: number, missionId: number): number {
    return missionId;
  }
}
