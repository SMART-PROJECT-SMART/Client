import { inject, Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { SleeveRo } from '../../models/Ro/sleeveRo.ro';
import { CreateUAVDto } from '../../models/dto/createUAV.dto';
import { UpdateUAVDto } from '../../models/dto/updateUAVDto.dto';
import { CreateSleeveDto } from '../../models/dto/createSleeveDto.dto';
import { UpdateSleeveDto } from '../../models/dto/updateSleeveDto.dto';
import { UAVRo } from '../../models/Ro/uavRO.ro';
import { DeviceManagerApiService } from './api/device-manager-api.service';

@Injectable({ providedIn: 'root' })
export class DeviceManagerStorageService {
  private readonly uavs = signal<UAVRo[]>([]);
  private readonly sleeves = signal<SleeveRo[]>([]);
  private readonly isLoadingUAVs = signal<boolean>(true);
  private readonly isLoadingSleeves = signal<boolean>(true);

  public readonly uavList = this.uavs.asReadonly();
  public readonly sleeveList = this.sleeves.asReadonly();
  public readonly loadingUAVs = this.isLoadingUAVs.asReadonly();
  public readonly loadingSleeves = this.isLoadingSleeves.asReadonly();

  private readonly apiService = inject(DeviceManagerApiService);

  public loadUAVs(): Observable<UAVRo[]> {
    this.isLoadingUAVs.set(true);
    return this.apiService.getAllUAVs().pipe(
      tap((uavs) => {
        this.uavs.set(uavs);
        this.isLoadingUAVs.set(false);
      }),
      catchError((error) => {
        this.isLoadingUAVs.set(false);
        return throwError(() => error);
      }),
    );
  }

  public createUAV(dto: CreateUAVDto): Observable<UAVRo[]> {
    this.isLoadingUAVs.set(true);
    return this.apiService.createUAV(dto).pipe(
      switchMap(() => this.loadUAVs()),
      catchError((error) => {
        this.isLoadingUAVs.set(false);
        return throwError(() => error);
      }),
    );
  }

  public updateUAV(tailId: number, dto: UpdateUAVDto): Observable<UAVRo[]> {
    this.isLoadingUAVs.set(true);
    return this.apiService.updateUAV(tailId, dto).pipe(
      switchMap(() => this.loadUAVs()),
      catchError((error) => {
        this.isLoadingUAVs.set(false);
        return throwError(() => error);
      }),
    );
  }

  public deleteUAV(tailId: number): Observable<UAVRo[]> {
    this.isLoadingUAVs.set(true);
    return this.apiService.deleteUAV(tailId).pipe(
      switchMap(() => this.loadUAVs()),
      catchError((error) => {
        this.isLoadingUAVs.set(false);
        return throwError(() => error);
      }),
    );
  }

  public loadSleeves(): Observable<SleeveRo[]> {
    this.isLoadingSleeves.set(true);
    return this.apiService.getAllSleeves().pipe(
      tap((sleeves) => {
        this.sleeves.set(sleeves);
        this.isLoadingSleeves.set(false);
      }),
      catchError((error) => {
        this.isLoadingSleeves.set(false);
        return throwError(() => error);
      }),
    );
  }

  public createSleeve(dto: CreateSleeveDto): Observable<SleeveRo[]> {
    this.isLoadingSleeves.set(true);
    return this.apiService.createSleeve(dto).pipe(
      switchMap(() => this.loadSleeves()),
      catchError((error) => {
        this.isLoadingSleeves.set(false);
        return throwError(() => error);
      }),
    );
  }

  public updateSleeve(sleeveName: string, dto: UpdateSleeveDto): Observable<SleeveRo[]> {
    this.isLoadingSleeves.set(true);
    return this.apiService.updateSleeve(sleeveName, dto).pipe(
      switchMap(() => this.loadSleeves()),
      catchError((error) => {
        this.isLoadingSleeves.set(false);
        return throwError(() => error);
      }),
    );
  }

  public deleteSleeve(sleeveName: string): Observable<SleeveRo[]> {
    this.isLoadingSleeves.set(true);
    return this.apiService.deleteSleeve(sleeveName).pipe(
      switchMap(() => this.loadSleeves()),
      catchError((error) => {
        this.isLoadingSleeves.set(false);
        return throwError(() => error);
      }),
    );
  }
}
