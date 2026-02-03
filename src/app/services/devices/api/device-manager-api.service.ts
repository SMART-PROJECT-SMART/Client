import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UAVRo } from '../../../models/Ro/uavRO.ro';
import { SleeveRo } from '../../../models/Ro/sleeveRo.ro';
import { CreateUAVDto } from '../../../models/dto/createUAV.dto';
import { UpdateUAVDto } from '../../../models/dto/updateUAVDto.dto';
import { CreateSleeveDto } from '../../../models/dto/createSleeveDto.dto';
import { UpdateSleeveDto } from '../../../models/dto/updateSleeveDto.dto';
import { ClientConstants } from '../../../common';

@Injectable({ providedIn: 'root' })
export class DeviceManagerApiService {
  constructor(private readonly httpClient: HttpClient) {}
  public getAllUAVs(): Observable<UAVRo[]> {
    return this.httpClient.get<UAVRo[]>(
      `${ClientConstants.DeviceServiceAPI.Endpoints.BASE_URL}${ClientConstants.DeviceServiceAPI.Endpoints.UAV_BASE}`,
    );
  }
  public createUAV(dto: CreateUAVDto): Observable<void> {
    return this.httpClient.post<void>(
      `${ClientConstants.DeviceServiceAPI.Endpoints.BASE_URL}${ClientConstants.DeviceServiceAPI.Endpoints.UAV_BASE}`,
      dto,
    );
  }
  public updateUAV(tailId: number, dto: UpdateUAVDto): Observable<void> {
    return this.httpClient.put<void>(
      `${ClientConstants.DeviceServiceAPI.Endpoints.BASE_URL}${ClientConstants.DeviceServiceAPI.Endpoints.UAV_BASE}/${tailId}`,
      dto,
    );
  }
  public deleteUAV(tailId: number): Observable<void> {
    return this.httpClient.delete<void>(
      `${ClientConstants.DeviceServiceAPI.Endpoints.BASE_URL}${ClientConstants.DeviceServiceAPI.Endpoints.UAV_BASE}/${tailId}`,
    );
  }

  public getAllSleeves(): Observable<SleeveRo[]> {
    return this.httpClient.get<SleeveRo[]>(
      `${ClientConstants.DeviceServiceAPI.Endpoints.BASE_URL}${ClientConstants.DeviceServiceAPI.Endpoints.SLEEVE_BASE}`,
    );
  }
  public getSleeveByName(sleeveName: string): Observable<SleeveRo> {
    return this.httpClient.get<SleeveRo>(
      `${ClientConstants.DeviceServiceAPI.Endpoints.BASE_URL}${ClientConstants.DeviceServiceAPI.Endpoints.SLEEVE_BASE}/${sleeveName}`,
    );
  }
  public createSleeve(dto: CreateSleeveDto): Observable<void> {
    return this.httpClient.post<void>(
      `${ClientConstants.DeviceServiceAPI.Endpoints.BASE_URL}${ClientConstants.DeviceServiceAPI.Endpoints.SLEEVE_BASE}`,
      dto,
    );
  }
  public updateSleeve(sleeveName: string, dto: UpdateSleeveDto): Observable<void> {
    return this.httpClient.put<void>(
      `${ClientConstants.DeviceServiceAPI.Endpoints.BASE_URL}${ClientConstants.DeviceServiceAPI.Endpoints.SLEEVE_BASE}/${sleeveName}`,
      dto,
    );
  }
  public deleteSleeve(sleeveName: string): Observable<void> {
    return this.httpClient.delete<void>(
      `${ClientConstants.DeviceServiceAPI.Endpoints.BASE_URL}${ClientConstants.DeviceServiceAPI.Endpoints.SLEEVE_BASE}/${sleeveName}`,
    );
  }
}
