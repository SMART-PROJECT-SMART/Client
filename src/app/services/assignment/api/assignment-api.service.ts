import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
    return this.httpClient.post<AssignmentRequestAcceptedRo>(url, dto);
  }

  public checkAssignmentStatus(assignmentId: string): Observable<AssignmentStatusRo> {
    const url: string = `${Endpoints.CHECK_ASSIGNMENT_STATUS}/${assignmentId}/status`;
    return this.httpClient.get<AssignmentStatusRo>(url);
  }

  public getAssignmentResult(assignmentId: string): Observable<AssignmentAlgorithmRo> {
    const url: string = `${Endpoints.GET_ASSIGNMENT_RESULT}/${assignmentId}`;
    return this.httpClient.get<AssignmentAlgorithmRo>(url);
  }

  public applyAssignment(dto: ApplyAssignmentDto): Observable<void> {
    const url: string = Endpoints.APPLY_ASSIGNMENT;
    return this.httpClient.post<void>(url, dto);
  }

  public getActiveMission(tailId: number): Observable<Mission | null> {
    return this.httpClient.get<Mission | null>(`${Endpoints.GET_ACTIVE_MISSION}/${tailId}`);
  }

  public markMissionCompleted(tailId: number): Observable<void> {
    return this.httpClient.post<void>(`${Endpoints.MISSION_COMPLETED}/${tailId}`, {});
  }
}
