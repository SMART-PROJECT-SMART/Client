import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type {
  AssignmentSuggestionDto,
  ApplyAssignmentDto,
  AssignmentRequestAcceptedRo,
  AssignmentStatusRo,
  AssignmentAlgorithmRo,
  Mission,
} from '../../../models';
import { ClientConstants } from '../../../common';

const { Endpoints } = ClientConstants.MissionServiceAPI;

@Injectable({
  providedIn: 'root',
})
export class AssignmentApiService {
  constructor(private readonly httpClient: HttpClient) {}

  public createAssignmentSuggestion(
    dto: AssignmentSuggestionDto
  ): Observable<AssignmentRequestAcceptedRo> {
    const url: string = Endpoints.CREATE_ASSIGNMENT_SUGGESTION;
    console.log('[API] POST', url, 'Body:', dto);
    return this.httpClient.post<AssignmentRequestAcceptedRo>(url, dto).pipe(
      tap((response: AssignmentRequestAcceptedRo) => console.log('[API] Response:', response))
    );
  }

  public checkAssignmentStatus(assignmentId: string): Observable<AssignmentStatusRo> {
    const url: string = `${Endpoints.CHECK_ASSIGNMENT_STATUS}/${assignmentId}/status`;
    console.log('[API] GET', url);
    return this.httpClient.get<AssignmentStatusRo>(url).pipe(
      tap((response: AssignmentStatusRo) => console.log('[API] Response:', response))
    );
  }

  public getAssignmentResult(assignmentId: string): Observable<AssignmentAlgorithmRo> {
    const url: string = `${Endpoints.GET_ASSIGNMENT_RESULT}/${assignmentId}`;
    console.log('[API] GET', url);
    return this.httpClient.get<AssignmentAlgorithmRo>(url).pipe(
      tap((response: AssignmentAlgorithmRo) => console.log('[API] Response:', response))
    );
  }

  public applyAssignment(dto: ApplyAssignmentDto): Observable<void> {
    const url: string = Endpoints.APPLY_ASSIGNMENT;
    console.log('[API] POST', url, 'Body:', dto);
    return this.httpClient.post<void>(url, dto).pipe(
      tap(() => console.log('[API] Apply assignment successful'))
    );
  }

  public getActiveMission(tailId: number): Observable<Mission | null> {
    return this.httpClient.get<Mission | null>(`${Endpoints.GET_ACTIVE_MISSION}/${tailId}`);
  }

  public markMissionCompleted(tailId: number): Observable<void> {
    return this.httpClient.post<void>(`${Endpoints.MISSION_COMPLETED}/${tailId}`, {});
  }
}
