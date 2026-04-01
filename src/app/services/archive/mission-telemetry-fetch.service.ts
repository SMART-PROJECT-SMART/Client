import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TelemetryField } from '../../common/enums';
import type { MissionTelemetryRo } from '../../models/archive';
import { isoQueryParamsFromDatetimeLocal } from '../../pages/archive/utils/mission-telemetry-time-range.util';
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
    fromInput: string,
    toInput: string,
  ): Observable<MissionTelemetryRo[]> {
    const { startTime, endTime } = isoQueryParamsFromDatetimeLocal(fromInput, toInput);
    return this.archiveApi.getMissionTelemetry(missionId, tailId, fields, startTime, endTime);
  }
}
