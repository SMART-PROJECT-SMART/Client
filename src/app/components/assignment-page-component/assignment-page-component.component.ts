import { Component, signal, computed, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import type {
  Mission,
  AssignmentAlgorithmRo,
  UAV,
  ApplyAssignmentDto,
  ApplyAssignmentRo,
} from '../../models';
import { AssignmentStage } from '../../common/enums';
import { AssignmentOrchestratorService } from '../../services/assignment/assignment-orchestrator.service';
import { ClientConstants, AssignmentUtil } from '../../common';

const { Messages } = ClientConstants.MissionServiceAPI;

@Component({
  selector: 'app-assignment-page-component',
  standalone: false,
  templateUrl: './assignment-page-component.component.html',
  styleUrl: './assignment-page-component.component.scss',
})
export class AssignmentPageComponentComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  public readonly AssignmentStage = AssignmentStage;
  public readonly messages = Messages;
  public readonly currentStage = signal<AssignmentStage>(AssignmentStage.MANAGEMENT);
  public readonly missions = signal<Mission[]>([]);
  public readonly assignmentResult = signal<AssignmentAlgorithmRo | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);

  constructor(private readonly orchestratorService: AssignmentOrchestratorService) {}

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public readonly availableUavs = computed<UAV[]>(() => {
    const result: AssignmentAlgorithmRo | null = this.assignmentResult();
    if (!result) return [];
    return AssignmentUtil.extractAllUavsFromTelemetry(result.uavTelemetryData);
  });

  public readonly hasValidResult = computed<boolean>(() => {
    const result = this.assignmentResult();
    return result !== null && result.pairings.length > 0;
  });

  public readonly hasEmptyResult = computed<boolean>(() => {
    const result = this.assignmentResult();
    return result !== null && result.pairings.length === 0;
  });

  public onMissionsSubmit(missions: Mission[]): void {
    this.missions.set(missions);
    this.setLoadingState(true);
    this.clearError();

    this.orchestratorService
      .submitMissionsAndPoll(missions)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: AssignmentAlgorithmRo) => {
          this.handleAssignmentSuccess(result);
        },
        error: (error: unknown) => {
          this.handleError(Messages.SUBMIT_ERROR, error);
        },
      });
  }

  public onBackToManagement(): void {
    this.resetToManagementStage();
  }

  public onViewResults(): void {
    this.currentStage.set(AssignmentStage.REVIEW);
  }

  public onApplyAssignment(event: ApplyAssignmentRo): void {
    this.setLoadingState(true);
    this.clearError();

    const dto: ApplyAssignmentDto = {
      suggestedAssignments: event.suggested,
      actualAssignments: event.actual,
    };

    this.orchestratorService
      .applyAssignment(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (): void => {
          this.handleApplySuccess();
        },
        error: (error: unknown) => {
          this.handleError(Messages.APPLY_ERROR, error);
        },
      });
  }

  private handleAssignmentSuccess(result: AssignmentAlgorithmRo): void {
    this.assignmentResult.set(result);
    this.setLoadingState(false);
    this.currentStage.set(AssignmentStage.REVIEW);
  }

  private handleApplySuccess(): void {
    this.resetToManagementStage();
    this.missions.set([]);
    this.setLoadingState(false);
  }

  private setLoadingState(isLoading: boolean): void {
    this.isLoading.set(isLoading);
  }

  private clearError(): void {
    this.errorMessage.set(null);
  }

  private resetToManagementStage(): void {
    this.currentStage.set(AssignmentStage.MANAGEMENT);
  }

  private handleError(userMessage: string, error: unknown): void {
    this.setLoadingState(false);
    this.errorMessage.set(userMessage);
  }
}
