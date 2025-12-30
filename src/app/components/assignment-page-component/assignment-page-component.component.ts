import { Component, signal } from '@angular/core';
import { Mission } from '../../models/mission.model';
import { AssignmentStage } from '../../common/enums/assignmentStage.enum';

@Component({
  selector: 'app-assignment-page-component',
  standalone: false,
  templateUrl: './assignment-page-component.component.html',
  styleUrl: './assignment-page-component.component.scss',
})
export class AssignmentPageComponentComponent {
  public readonly AssignmentStage = AssignmentStage;
  public currentStage = signal<AssignmentStage>(AssignmentStage.MANAGEMENT);
  public missions = signal<Mission[]>([]);

  public onMissionsSubmit(missions: Mission[]): void {
    this.missions.set(missions);
    this.currentStage.set(AssignmentStage.REVIEW);
  }

  public onBackToManagement(): void {
    this.currentStage.set(AssignmentStage.MANAGEMENT);
  }
}
