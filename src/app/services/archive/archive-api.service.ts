import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, firstValueFrom, from, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClientConstants } from '../../common/constants/clientConstants.constant';
import type {
  ArchiveAssignmentRo,
  ArchiveMissionRo,
  MissionTelemetryPageRo,
  MissionTelemetryRo,
} from '../../models/archive';

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
    startTime?: string,
    endTime?: string,
  ): Observable<MissionTelemetryRo[]> {
    return defer(() =>
      from(this.loadMissionTelemetryAllPages(missionId, tailId, fields, startTime, endTime)),
    );
  }

  getMissionById(missionId: string): Observable<ArchiveMissionRo | null> {
    return this.http.get<ArchiveMissionRo>(ArchiveAPI.BY_MISSION(missionId)).pipe(
      catchError(() => of(null)),
    );
  }

  private async loadMissionTelemetryAllPages(
    missionId: string,
    tailId: number,
    fields?: string[],
    startTime?: string,
    endTime?: string,
  ): Promise<MissionTelemetryRo[]> {
    const pageSize = TelemetryDataAPI.DEFAULT_PAGE_SIZE;
    const merged: MissionTelemetryRo[] = [];
    let page = 0;
    let totalCount = 0;
    do {
      const url = TelemetryDataAPI.BY_MISSION(missionId, tailId, fields, startTime, endTime, page, pageSize);
      const response = await firstValueFrom(this.http.get<MissionTelemetryPageRo>(url));
      merged.push(...response.items);
      totalCount = response.totalCount;
      if (response.items.length === 0) {
        break;
      }
      page += 1;
    } while (merged.length < totalCount);
    return merged;
  }
}
