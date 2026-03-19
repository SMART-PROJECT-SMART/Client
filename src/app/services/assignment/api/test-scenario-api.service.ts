import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { TestScenario, Mission } from '../../../models';
import { ClientConstants } from '../../../common';

const { Endpoints } = ClientConstants.MissionServiceAPI;

@Injectable({
  providedIn: 'root',
})
export class TestScenarioApiService {
  constructor(private readonly httpClient: HttpClient) {}

  public getScenarios(): Observable<TestScenario[]> {
    return this.httpClient.get<TestScenario[]>(Endpoints.GET_TEST_SCENARIOS);
  }

  public getMissionsForScenarios(scenarios: string[]): Observable<Mission[]> {
    return this.httpClient.post<Mission[]>(Endpoints.GET_SCENARIO_MISSIONS, { scenarios });
  }
}
