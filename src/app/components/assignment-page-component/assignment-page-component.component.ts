import { Component, QueryList, ViewChildren } from '@angular/core';
import { ClientConstants } from '../../common';
import { MissionComponentComponent } from '../mission-component/mission-component.component';

const { ADD_MISSION_LABEL, SUBMIT_LABEL } = ClientConstants.AssignmentPageConstants;

@Component({
  selector: 'app-assignment-page-component',
  standalone: false,
  templateUrl: './assignment-page-component.component.html',
  styleUrl: './assignment-page-component.component.scss',
})
export class AssignmentPageComponentComponent {
  @ViewChildren(MissionComponentComponent)
  public missionComponents!: QueryList<MissionComponentComponent>;

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
    const missions = this.missionComponents.map((component) => component.missionForm.value);
    console.log('Submit missions:', missions);
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
