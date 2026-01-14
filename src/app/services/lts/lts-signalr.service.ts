import { Injectable, signal, WritableSignal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import type { TelemetryBroadcastDto, UAVWantedFields, UpdateWantedFieldsDto } from '../../models';
import { TelemetryField } from '../../common/enums';
import {
  SignalRConstants,
  defaultWantedFields,
} from '../../common/constants/signalRConstants.constants';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { UAVStoreService } from '../uav/uav-store.service';

const { LTS, Endpoints } = SignalRConstants;

@Injectable({
  providedIn: 'root',
})
export class LtsSignalRService {
  private connection: signalR.HubConnection | null = null;
  private sessionId: string | null = null;
  constructor(private readonly uavStoreService: UAVStoreService) {
    this.sessionId = crypto.randomUUID();
  }
  public readonly isConnected: WritableSignal<boolean> = signal<boolean>(false);
  public readonly latestTelemetry: WritableSignal<TelemetryBroadcastDto | null> =
    signal<TelemetryBroadcastDto | null>(null);

  public async connect(uavTailIds: number[]): Promise<void> {
    if (this.connection) {
      await this.disconnect();
    }

    const hubUrl = `${LTS.BASE_URL}${LTS.HUB_ENDPOINT}?sessionId=${this.sessionId}`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    this.setupEventHandlers();

    await this.connection.start();
    this.isConnected.set(true);

    await firstValueFrom(this.waitForSessionReady());

    await this.subscribeToUAVs(uavTailIds, defaultWantedFields);
  }

  public async connectToAllUAVs(): Promise<void> {
    await this.connect([LTS.WILDCARD_ALL_UAVS]);
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.sessionId = null;
      this.isConnected.set(false);
      this.latestTelemetry.set(null);
    }
  }

  public async subscribeToUAVs(
    uavTailIds: number[],
    wantedFields: TelemetryField[]
  ): Promise<void> {
    const uavWantedFields: UAVWantedFields[] = uavTailIds.map((tailId: number) => ({
      tailId: tailId,
      wantedFields: wantedFields,
    }));

    const dto: UpdateWantedFieldsDto = {
      wantedFields: uavWantedFields,
    };

    const url = `${LTS.BASE_URL}${Endpoints.UPDATE_WANTED_FIELDS}/${this.sessionId}`;

    const response: Response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  }

  public getSessionId(): string | null {
    return this.sessionId;
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.on(LTS.RECEIVE_TELEMETRY_METHOD, (data: TelemetryBroadcastDto) => {
      this.latestTelemetry.set(data);
      this.uavStoreService.updateActiveUAVs(data);
    });

    this.connection.onreconnecting((error) => {
      this.isConnected.set(false);
    });

    this.connection.onreconnected((connectionId) => {
      this.isConnected.set(true);
    });

    this.connection.onclose((error) => {
      this.isConnected.set(false);
    });
  }

  private sessionReadySubject: Subject<string> | null = null;

  private waitForSessionReady(): Observable<string> {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized');
    }
    if (this.sessionReadySubject) {
      this.sessionReadySubject.complete();
    }
    this.sessionReadySubject = new Subject<string>();
    const handler = (sessionId: string) => {
      this.sessionReadySubject?.next(sessionId);
      this.sessionReadySubject?.complete();
      this.connection?.off('SessionReady', handler);
    };
    this.connection.on('SessionReady', handler);
    return this.sessionReadySubject.asObservable();
  }
}
