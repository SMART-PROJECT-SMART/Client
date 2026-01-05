import { Component, output, viewChildren } from '@angular/core';
import { ClientConstants } from '../../common';
import { MissionComponentComponent } from '../mission-component/mission-component.component';
import type { Mission } from '../../models';

const { ADD_MISSION_LABEL, SUBMIT_LABEL } = ClientConstants.AssignmentPageConstants;

@Component({
  selector: 'app-assignment-management-component',
  standalone: false,
  templateUrl: './assignment-management-component.html',
  styleUrl: './assignment-management-component.scss',
})
export class AssignmentManagementComponent {
  public readonly missionComponents = viewChildren(MissionComponentComponent);
  public readonly missionsSubmit = output<Mission[]>();
  public readonly addMissionLabel: string = ADD_MISSION_LABEL;
  public readonly submitLabel: string = SUBMIT_LABEL;
  public missionIds: number[] = [];

  private nextMissionId: number = 0;

  public onAddMission(): void {
    this.missionIds.push(this.nextMissionId++);
  }

  public onRemoveMission(missionId: number): void {
    this.missionIds = this.missionIds.filter((id) => id !== missionId);
  }

  public onSubmit(): void {
    const missions: Mission[] = this.missionComponents().map((component: MissionComponentComponent) => {
      const formValue = component.missionForm.value;
      return {
        id: formValue.missionId!,
        requiredUAVType: formValue.requiredUAVType!,
        priority: formValue.priority!,
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

    return this.missionComponents().some((component: MissionComponentComponent) => component.missionForm.invalid);
  }

  public trackByMissionId(_index: number, missionId: number): number {
    return missionId;
  }
}
