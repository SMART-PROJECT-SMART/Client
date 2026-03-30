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

const { ArchiveAPI } = ClientConstants;

const {
  DEFAULT_PAGE_SIZE,
  INITIAL_PAGE_INDEX,
  MAX_PAGE_FETCH_ITERATIONS,
  BY_MISSION: buildTelemetryByMissionUrl,
} = ClientConstants.TelemetryDataAPI;

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
    const merged: MissionTelemetryRo[] = [];
    let page = INITIAL_PAGE_INDEX;
    let iteration = 0;
    while (iteration < MAX_PAGE_FETCH_ITERATIONS) {
      iteration += 1;
      const url = buildTelemetryByMissionUrl(missionId, tailId, fields, startTime, endTime, page, DEFAULT_PAGE_SIZE);
      const response = await firstValueFrom(this.http.get<MissionTelemetryPageRo>(url));
      merged.push(...response.items);
      if (this.shouldStopTelemetryPageFetch(response, merged.length, DEFAULT_PAGE_SIZE)) {
        break;
      }
      page += 1;
    }
    return merged;
  }

  private shouldStopTelemetryPageFetch(
    response: MissionTelemetryPageRo,
    mergedLength: number,
    pageSize: number,
  ): boolean {
    if (response.items.length === 0) {
      return true;
    }
    const totalCount = Number(response.totalCount);
    if (totalCount > 0 && mergedLength >= totalCount) {
      return true;
    }
    if (response.items.length < pageSize) {
      return true;
    }
    return false;
  }
}
