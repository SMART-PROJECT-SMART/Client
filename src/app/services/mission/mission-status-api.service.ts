import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActiveMissionRo } from '../../models/Ro/activeMissionRo.ro';
import { ClientConstants } from '../../common';

const { Endpoints } = ClientConstants.MissionServiceAPI;

@Injectable({ providedIn: 'root' })
export class MissionStatusApiService {
  private readonly httpClient = inject(HttpClient);

  public getActiveMissions(): Observable<ActiveMissionRo[]> {
    return this.httpClient.get<ActiveMissionRo[]>(Endpoints.GET_ALL_ACTIVE_MISSIONS);
  }
}
