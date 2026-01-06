import { Component, output, viewChildren, input, OnInit, computed, signal, effect } from '@angular/core';
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
export class AssignmentManagementComponent implements OnInit {
  public readonly missions = input<Mission[]>([]);
  public readonly hasResult = input<boolean>(false);
  public readonly missionComponents = viewChildren(MissionComponentComponent);
  public readonly missionsSubmit = output<Mission[]>();
  public readonly viewResults = output<void>();
  public readonly addMissionLabel: string = ADD_MISSION_LABEL;
  public readonly submitLabel: string = SUBMIT_LABEL;
  public missionIds: number[] = [];
  public storedMissions: Mission[] = [];
  private readonly hasModificationsSignal = signal<boolean>(false);

  public readonly showViewResults = computed<boolean>(() => {
    return this.hasResult() && !this.hasModificationsSignal();
  });

  constructor() {
    effect(() => {
      const components = this.missionComponents();
      if (components.length > 0) {
        this.checkForModifications();
      }
    });
  }

  public ngOnInit(): void {
    const inputMissions = this.missions();
    if (inputMissions.length > 0) {
      this.storedMissions = inputMissions;
      this.missionIds = inputMissions.map((_, index) => index);
    }
  }

  public onAddMission(): void {
    this.missionIds.push(this.missionIds.length);
    this.hasModificationsSignal.set(true);
  }

  public onRemoveMission(missionId: number): void {
    this.missionIds = this.missionIds.filter((id) => id !== missionId);
    this.hasModificationsSignal.set(true);
  }

  public onSubmit(): void {
    const missions: Mission[] = this.missionComponents().map((component: MissionComponentComponent) => {
      const formValue = component.missionForm.value;
      return {
        id: formValue.missionId!,
        title: formValue.title!,
        requiredUAVType: formValue.requiredUAVType!,
        priority: formValue.priority!,
        location: formValue.location!,
        timeWindow: formValue.timeWindow!,
      } as Mission;
    });
    this.missionsSubmit.emit(missions);
  }

  public onViewResults(): void {
    this.viewResults.emit();
  }

  public onFormChange(): void {
    this.hasModificationsSignal.set(true);
  }

  private checkForModifications(): void {
    const currentComponents = this.missionComponents();
    if (currentComponents.length !== this.storedMissions.length) {
      this.hasModificationsSignal.set(true);
      return;
    }
    
    const hasDirtyForms = currentComponents.some((component: MissionComponentComponent) => {
      return component.missionForm.dirty;
    });
    this.hasModificationsSignal.set(hasDirtyForms);
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
