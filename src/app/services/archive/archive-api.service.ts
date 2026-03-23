import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClientConstants } from '../../common/constants/clientConstants.constant';
import type { ArchiveAssignmentRo, ArchiveMissionRo, MissionTelemetryRo } from '../../models/archive';

const { ArchiveAPI, TelemetryDataAPI } = ClientConstants;

@Injectable({
  providedIn: 'root',
})
export class ArchiveApiService {
  private readonly http = inject(HttpClient);

  getLatest(): Observable<ArchiveAssignmentRo | null> {
    return this.http.get<ArchiveAssignmentRo>(ArchiveAPI.LATEST).pipe(
      catchError(() => of(null))
    );
  }

  getByDate(date: string): Observable<ArchiveAssignmentRo[]> {
    return this.http.get<ArchiveAssignmentRo[]>(ArchiveAPI.BY_DATE(date)).pipe(catchError(() => of([])));
  }

  getMissionTelemetry(
    missionId: string,
    tailId: number,
    fields?: string[],
    startTime?: string | null,
    endTime?: string | null,
  ): Observable<MissionTelemetryRo[]> {
    return this.http.get<MissionTelemetryRo[]>(
      TelemetryDataAPI.BY_MISSION(missionId, tailId, fields, startTime, endTime),
    );
  }

  getMissionById(missionId: string): Observable<ArchiveMissionRo | null> {
    return this.http.get<ArchiveMissionRo>(ArchiveAPI.BY_MISSION(missionId)).pipe(
      catchError(() => of(null)),
    );
  }
}
