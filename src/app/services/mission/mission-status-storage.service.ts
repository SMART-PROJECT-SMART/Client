import { inject, Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ActiveMissionRo } from '../../models/Ro/activeMissionRo.ro';
import { MissionStatusApiService } from './mission-status-api.service';

@Injectable({ providedIn: 'root' })
export class MissionStatusStorageService {
  private readonly missionStatusApiService = inject(MissionStatusApiService);

  private readonly activeMissions = signal<ActiveMissionRo[]>([]);
  private readonly isLoadingActiveMissions = signal<boolean>(true);

  public readonly activeMissionList = this.activeMissions.asReadonly();
  public readonly loadingActiveMissions = this.isLoadingActiveMissions.asReadonly();

  public loadActiveMissions(): Observable<ActiveMissionRo[]> {
    this.isLoadingActiveMissions.set(true);
    return this.missionStatusApiService.getActiveMissions().pipe(
      tap((missions) => {
        this.activeMissions.set(missions);
        this.isLoadingActiveMissions.set(false);
      }),
      catchError((error) => {
        this.isLoadingActiveMissions.set(false);
        return throwError(() => error);
      }),
    );
  }
}
