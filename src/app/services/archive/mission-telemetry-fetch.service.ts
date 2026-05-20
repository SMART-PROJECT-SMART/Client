import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TelemetryField } from '../../common/enums';
import type { MissionTelemetryRo } from '../../models/archive';
import { ArchiveApiService } from './archive-api.service';

@Injectable({
  providedIn: 'root',
})
export class MissionTelemetryFetchService {
  private readonly archiveApi = inject(ArchiveApiService);

  fetchTelemetryRows(
    missionId: string,
    tailId: number,
    fields: TelemetryField[],
    startTimeIsoUtc: string,
    endTimeIsoUtc: string,
  ): Observable<MissionTelemetryRo[]> {
    return this.archiveApi.getMissionTelemetry(missionId, tailId, fields, startTimeIsoUtc, endTimeIsoUtc);
  }
}
