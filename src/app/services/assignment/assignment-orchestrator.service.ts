import { Injectable } from '@angular/core';
import {
  Observable,
  EMPTY,
  timer,
  throwIfEmpty,
  switchMap,
  exhaustMap,
  take,
  catchError,
  throwError,
  map,
  timeout,
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
        return throwError(() => error);
      }),
    );
  }

  public applyAssignment(dto: ApplyAssignmentDto): Observable<void> {
    return this.assignmentApiService.applyAssignment(dto).pipe(
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }

  private pollUntilComplete(assignmentId: string): Observable<AssignmentAlgorithmRo> {
    return timer(0, PollingConstants.POLLING_INTERVAL_MS).pipe(
      take(PollingConstants.POLLING_MAX_ATTEMPTS),
      exhaustMap((attemptIndex: number) =>
        this.checkStatus(assignmentId).pipe(
          timeout(PollingConstants.STATUS_REQUEST_TIMEOUT_MS),
          map((status: AssignmentStatusRo) => ({ status, attempt: attemptIndex + 1 })),
        ),
      ),
      switchMap(({ status }) => {
        if (status.status === AssignmentStatus.Completed) {
          return [status];
        }
        if (
          status.status === AssignmentStatus.Pending ||
          status.status === AssignmentStatus.Processing
        ) {
          return EMPTY;
        }
        return throwError(() => new Error(ErrorMessages.POLL_STATUS_ERROR));
      }),
      take(1),
      throwIfEmpty(() => new Error(ErrorMessages.POLLING_IN_PROGRESS)),
      switchMap(() => this.fetchResult(assignmentId)),
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }

  private checkStatus(assignmentId: string): Observable<AssignmentStatusRo> {
    return this.assignmentApiService.checkAssignmentStatus(assignmentId);
  }

  private fetchResult(assignmentId: string): Observable<AssignmentAlgorithmRo> {
    return this.assignmentApiService.getAssignmentResult(assignmentId);
  }
}
