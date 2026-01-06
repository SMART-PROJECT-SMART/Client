import { Injectable } from '@angular/core';
import {
  Observable,
  interval,
  switchMap,
  takeWhile,
  catchError,
  throwError,
  filter,
  take,
} from 'rxjs';
import { AssignmentApiService } from './api/assignment-api.service';
import type {
  Mission,
  AssignmentSuggestionDto,
  AssignmentAlgorithmRo,
  ApplyAssignmentDto,
  AssignmentStatusRo,
} from '../../models';
import { AssignmentStatus } from '../../common/enums';
import { ClientConstants } from '../../common';

const { PollingConstants, ErrorMessages } = ClientConstants.MissionServiceAPI;

@Injectable({
  providedIn: 'root',
})
export class AssignmentOrchestratorService {
  constructor(private readonly assignmentApiService: AssignmentApiService) {}

  public submitMissionsAndPoll(missions: Mission[]): Observable<AssignmentAlgorithmRo> {
    const dto: AssignmentSuggestionDto = { missions };

    return this.assignmentApiService.createAssignmentSuggestion(dto).pipe(
      switchMap((response) => this.pollUntilComplete(response.assignmentId)),
      catchError((error) => {
        console.error(ErrorMessages.SUBMIT_MISSIONS_ERROR, error);
        return throwError(() => error);
      })
    );
  }

  public applyAssignment(dto: ApplyAssignmentDto): Observable<void> {
    return this.assignmentApiService.applyAssignment(dto).pipe(
      catchError((error) => {
        console.error(ErrorMessages.APPLY_ASSIGNMENT_ERROR, error);
        return throwError(() => error);
      })
    );
  }

  private pollUntilComplete(assignmentId: string): Observable<AssignmentAlgorithmRo> {
    return interval(PollingConstants.POLLING_INTERVAL_MS).pipe(
      switchMap(() => this.checkStatus(assignmentId)),
      takeWhile((status: AssignmentStatusRo) => status.status !== AssignmentStatus.Completed, true),
      filter((status: AssignmentStatusRo) => status.status === AssignmentStatus.Completed),
      take(1),
      switchMap(() => this.fetchResult(assignmentId)),
      catchError((error) => {
        console.error(ErrorMessages.POLL_STATUS_ERROR, error);
        return throwError(() => error);
      })
    );
  }

  private checkStatus(assignmentId: string): Observable<AssignmentStatusRo> {
    return this.assignmentApiService.checkAssignmentStatus(assignmentId);
  }

  private fetchResult(assignmentId: string): Observable<AssignmentAlgorithmRo> {
    return this.assignmentApiService.getAssignmentResult(assignmentId);
  }
}
