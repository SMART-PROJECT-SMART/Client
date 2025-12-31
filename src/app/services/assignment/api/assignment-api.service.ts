import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AssignmentSuggestionDto } from '../../../models/dto/assignmentSuggestionDto.dto';
import { ApplyAssignmentDto } from '../../../models/dto/applyAssignmentDto.dto';
import { AssignmentRequestAcceptedRo } from '../../../models/Ro/assignmentRequestAcceptedRo.ro';
import { AssignmentStatusRo } from '../../../models/Ro/assignmentStatusRo.ro';
import { AssignmentAlgorithmRo } from '../../../models/Ro/assignmentAlgorithmRo.ro';
import { ClientConstants } from '../../../common';

const { Endpoints } = ClientConstants.MissionServiceAPI;

@Injectable({
  providedIn: 'root',
})
export class AssignmentApiService {
  constructor(private httpClient: HttpClient) {}

  public createAssignmentSuggestion(
    dto: AssignmentSuggestionDto
  ): Observable<AssignmentRequestAcceptedRo> {
    return this.httpClient.post<AssignmentRequestAcceptedRo>(
      Endpoints.CREATE_ASSIGNMENT_SUGGESTION,
      dto
    );
  }

  public checkAssignmentStatus(assignmentId: string): Observable<AssignmentStatusRo> {
    return this.httpClient.get<AssignmentStatusRo>(
      `${Endpoints.CHECK_ASSIGNMENT_STATUS}/${assignmentId}/status`
    );
  }

  public getAssignmentResult(assignmentId: string): Observable<AssignmentAlgorithmRo> {
    return this.httpClient.get<AssignmentAlgorithmRo>(`${Endpoints.GET_ASSIGNMENT_RESULT}/${assignmentId}`);
  }

  public applyAssignment(dto: ApplyAssignmentDto): Observable<void> {
    return this.httpClient.post<void>(Endpoints.APPLY_ASSIGNMENT, dto);
  }

  public getActiveMission(tailId: number): Observable<any> {
    return this.httpClient.get<any>(`${Endpoints.GET_ACTIVE_MISSION}/${tailId}`);
  }

  public markMissionCompleted(tailId: number): Observable<void> {
    return this.httpClient.post<void>(`${Endpoints.MISSION_COMPLETED}/${tailId}`, {});
  }
}
