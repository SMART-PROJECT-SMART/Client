import { Component, signal, inject, computed } from '@angular/core';
import type {
  Mission,
  AssignmentSuggestionDto,
  AssignmentAlgorithmRo,
  MissionToUavAssignment,
  UAV,
  ApplyAssignmentDto,
} from '../../models';
import { AssignmentStage } from '../../common/enums/assignmentStage.enum';
import { AssignmentApiService } from '../../services/assignment/api/assignment-api.service';
import { ClientConstants } from '../../common';
import { interval, switchMap, takeWhile } from 'rxjs';

const { PollingConstants, Messages } = ClientConstants.MissionServiceAPI;

@Component({
  selector: 'app-assignment-page-component',
  standalone: false,
  templateUrl: './assignment-page-component.component.html',
  styleUrl: './assignment-page-component.component.scss',
})
export class AssignmentPageComponentComponent {
  private readonly assignmentApiService = inject(AssignmentApiService);

  public readonly AssignmentStage = AssignmentStage;
  public readonly messages = Messages;
  public currentStage = signal<AssignmentStage>(AssignmentStage.MANAGEMENT);
  public missions = signal<Mission[]>([]);
  public assignmentResult = signal<AssignmentAlgorithmRo | null>(null);
  public isLoading = signal(false);
  public errorMessage = signal<string | null>(null);

  public availableUavs = computed<UAV[]>(() => {
    const result = this.assignmentResult();
    if (!result) return [];
    const uavMap = new Map<number, UAV>();
    result.assignments.forEach((assignment) => {
      uavMap.set(assignment.uav.tailId, assignment.uav);
    });
    return Array.from(uavMap.values());
  });

  public onMissionsSubmit(missions: Mission[]): void {
    this.missions.set(missions);
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const dto: AssignmentSuggestionDto = { missions };

    this.assignmentApiService.createAssignmentSuggestion(dto).subscribe({
      next: (response) => {
        this.pollAssignmentStatus(response.assignmentId);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(Messages.SUBMIT_ERROR);
        console.error('Error creating assignment suggestion:', error);
      },
    });
  }

  public onBackToManagement(): void {
    this.currentStage.set(AssignmentStage.MANAGEMENT);
    this.assignmentResult.set(null);
  }

  public onApplyAssignment(data: { suggested: MissionToUavAssignment[]; actual: MissionToUavAssignment[] }): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const dto: ApplyAssignmentDto = {
      suggestedAssignments: data.suggested,
      actualAssignments: data.actual,
    };

    this.assignmentApiService.applyAssignment(dto).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.currentStage.set(AssignmentStage.MANAGEMENT);
        this.assignmentResult.set(null);
        this.missions.set([]);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(Messages.SUBMIT_ERROR);
        console.error('Error applying assignment:', error);
      },
    });
  }

  private pollAssignmentStatus(assignmentId: string): void {
    interval(PollingConstants.POLLING_INTERVAL_MS)
      .pipe(
        switchMap(() => this.assignmentApiService.checkAssignmentStatus(assignmentId)),
        takeWhile((status) => status.status !== 'Completed', true)
      )
      .subscribe({
        next: (status) => {
          if (status.status === 'Completed') {
            this.fetchAssignmentResult(assignmentId);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(Messages.STATUS_ERROR);
          console.error('Error polling assignment status:', error);
        },
      });
  }

  private fetchAssignmentResult(assignmentId: string): void {
    this.assignmentApiService.getAssignmentResult(assignmentId).subscribe({
      next: (result) => {
        this.assignmentResult.set(result);
        this.isLoading.set(false);
        this.currentStage.set(AssignmentStage.REVIEW);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(Messages.RESULT_ERROR);
        console.error('Error fetching assignment result:', error);
      },
    });
  }
}
