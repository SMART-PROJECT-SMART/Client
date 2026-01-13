import { Injectable, signal, WritableSignal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import type {
  TelemetryBroadcastDto,
  UAVWantedFields,
  UpdateWantedFieldsDto,
} from '../../models';
import { TelemetryField } from '../../common/enums';
import { SignalRConstants, defaultWantedFields } from '../../common/constants/signalRConstants.constants';

const { LTS, Endpoints } = SignalRConstants;

@Injectable({
  providedIn: 'root',
})
export class LtsSignalRService {
  private connection: signalR.HubConnection | null = null;
  private sessionId: string | null = null;

  public readonly isConnected: WritableSignal<boolean> = signal<boolean>(false);
  public readonly latestTelemetry: WritableSignal<TelemetryBroadcastDto | null> =
    signal<TelemetryBroadcastDto | null>(null);

  public async connect(uavTailIds: number[]): Promise<void> {
    if (this.connection) {
      await this.disconnect();
    }

    this.sessionId = crypto.randomUUID();

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${LTS.BASE_URL}${LTS.HUB_ENDPOINT}?sessionId=${this.sessionId}`)
      .withAutomaticReconnect()
      .build();

    this.setupEventHandlers();

    await this.connection.start();
    this.isConnected.set(true);

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
    if (!this.sessionId) {
      throw new Error('Not connected to LTS. Call connect() first.');
    }

    const uavWantedFields: UAVWantedFields[] = uavTailIds.map((tailId: number) => ({
      tailId: tailId,
      wantedFields: wantedFields,
    }));

    const dto: UpdateWantedFieldsDto = {
      wantedFields: uavWantedFields,
    };

    const response: Response = await fetch(
      `${LTS.BASE_URL}${Endpoints.UPDATE_WANTED_FIELDS}/${this.sessionId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to subscribe to UAVs: ${response.statusText}`);
    }
  }

  public getSessionId(): string | null {
    return this.sessionId;
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.on(LTS.RECEIVE_TELEMETRY_METHOD, (data: TelemetryBroadcastDto) => {
      this.latestTelemetry.set(data);
    });

    this.connection.onreconnecting(() => {
      this.isConnected.set(false);
    });

    this.connection.onreconnected(() => {
      this.isConnected.set(true);
    });

    this.connection.onclose(() => {
      this.isConnected.set(false);
    });
  }
}
