import { Component, signal, computed, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import type {
  Mission,
  AssignmentAlgorithmRo,
  UAV,
  ApplyAssignmentDto,
  ApplyAssignmentRo,
} from '../../../models';
import { AssignmentStage } from '../../../common/enums';
import { AssignmentOrchestratorService } from '../../../services/assignment/assignment-orchestrator.service';
import { ClientConstants, AssignmentUtil } from '../../../common';

const { Messages, SnackbarConfig } = ClientConstants.MissionServiceAPI;

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

  constructor(
    private readonly orchestratorService: AssignmentOrchestratorService,
    private readonly snackBar: MatSnackBar,
  ) {}

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
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.orchestratorService
      .submitMissionsAndPoll(missions)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: AssignmentAlgorithmRo) => {
          this.handleMissionSubmitSuccess(result);
        },
        error: (error: unknown) => {
          this.handleError(Messages.SUBMIT_ERROR, error);
        },
      });
  }

  public onBackToManagement(): void {
    this.currentStage.set(AssignmentStage.MANAGEMENT);
  }

  public onViewResults(): void {
    this.currentStage.set(AssignmentStage.REVIEW);
  }

  public onApplyAssignment(event: ApplyAssignmentRo): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

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

  private handleMissionSubmitSuccess(successResult: AssignmentAlgorithmRo): void {
    this.assignmentResult.set(successResult);
    this.isLoading.set(false);
    this.currentStage.set(AssignmentStage.REVIEW);
  }

  private handleApplySuccess(): void {
    this.assignmentResult.set(null);
    this.missions.set([]);
    this.currentStage.set(AssignmentStage.MANAGEMENT);
    this.isLoading.set(false);
    this.snackBar.open(Messages.APPLY_SUCCESS_MESSAGE, Messages.SNACKBAR_CLOSE_ACTION, {
      duration: SnackbarConfig.DURATION_MS,
      horizontalPosition: SnackbarConfig.HORIZONTAL_POSITION as 'center',
      verticalPosition: SnackbarConfig.VERTICAL_POSITION as 'top',
    });
  }

  private handleError(userMessage: string, error: unknown): void {
    this.isLoading.set(false);
    this.errorMessage.set(userMessage);
  }
}
