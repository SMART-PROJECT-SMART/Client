import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ClientConstants } from '../../../common';
import type { TestScenario, Mission } from '../../../models';
import { Priority, UAVType } from '../../../common/enums';

const { HOUR_IN_MS, STRESS_TEST_MISSION_COUNT, LOCATION_LABELS, STRESS_TEST_LOCATION_LABELS } =
  ClientConstants.AssignmentPageConstants.QuickAddMissionNaming;

const SCENARIO_REGISTRY = {
  'basic-equal-assignment': {
    label: 'Basic Assignment',
    buildMissions: (baseTime: Date): Mission[] => [
      buildMission('M1', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.TEL_AVIV), UAVType.Surveillance, Priority.High, baseTime, 1, 5, 32.0853, 34.7818, 100),
      buildMission('M2', createMissionTitle(UAVType.Armed, LOCATION_LABELS.JERUSALEM), UAVType.Armed, Priority.Medium, baseTime, 2, 6, 31.7683, 35.2137, 150),
    ],
  },
  'resource-constrained': {
    label: 'Resource Constrained',
    buildMissions: (baseTime: Date): Mission[] => [
      buildMission('M1', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.TEL_AVIV), UAVType.Surveillance, Priority.High, baseTime, 1, 3, 32.0853, 34.7818, 100),
      buildMission('M2', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.JERUSALEM), UAVType.Surveillance, Priority.Medium, baseTime, 4, 6, 31.7683, 35.2137, 150),
      buildMission('M3', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.HADERA), UAVType.Surveillance, Priority.Low, baseTime, 7, 9, 32.4427, 34.9235, 200),
      buildMission('M4', createMissionTitle(UAVType.Armed, LOCATION_LABELS.BEERSHEBA), UAVType.Armed, Priority.High, baseTime, 2, 5, 31.2530, 34.7915, 120),
    ],
  },
  'time-overlap-conflict': {
    label: 'Time Overlap Conflict',
    buildMissions: (baseTime: Date): Mission[] => [
      buildMission('M1', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.TEL_AVIV), UAVType.Surveillance, Priority.High, baseTime, 1, 4, 32.0853, 34.7818, 100),
      buildMission('M2', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.JERUSALEM), UAVType.Surveillance, Priority.High, baseTime, 3, 6, 31.7683, 35.2137, 150),
      buildMission('M3', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.HADERA), UAVType.Surveillance, Priority.Medium, baseTime, 5, 8, 32.4427, 34.9235, 200),
    ],
  },
  'priority-assignment': {
    label: 'Priority Mix',
    buildMissions: (baseTime: Date): Mission[] => [
      buildMission('M1', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.TEL_AVIV), UAVType.Surveillance, Priority.Low, baseTime, 1, 4, 32.0853, 34.7818, 100),
      buildMission('M2', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.JERUSALEM), UAVType.Surveillance, Priority.High, baseTime, 1, 4, 31.7683, 35.2137, 150),
      buildMission('M3', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.HADERA), UAVType.Surveillance, Priority.Medium, baseTime, 1, 4, 32.4427, 34.9235, 200),
    ],
  },
  'mixed-types': {
    label: 'Mixed Types',
    buildMissions: (baseTime: Date): Mission[] => [
      buildMission('M1', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.TEL_AVIV), UAVType.Surveillance, Priority.High, baseTime, 1, 3, 32.0853, 34.7818, 100),
      buildMission('M2', createMissionTitle(UAVType.Armed, LOCATION_LABELS.JERUSALEM), UAVType.Armed, Priority.High, baseTime, 2, 5, 31.7683, 35.2137, 150),
      buildMission('M3', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.HADERA), UAVType.Surveillance, Priority.Medium, baseTime, 4, 7, 32.4427, 34.9235, 200),
      buildMission('M4', createMissionTitle(UAVType.Armed, LOCATION_LABELS.BEERSHEBA), UAVType.Armed, Priority.Low, baseTime, 6, 9, 31.2530, 34.7915, 120),
    ],
  },
  'sequential-missions': {
    label: 'Sequential Missions',
    buildMissions: (baseTime: Date): Mission[] => [
      buildMission('M1', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.TEL_AVIV), UAVType.Surveillance, Priority.High, baseTime, 1, 3, 32.0853, 34.7818, 100),
      buildMission('M2', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.JERUSALEM), UAVType.Surveillance, Priority.High, baseTime, 4, 6, 31.7683, 35.2137, 150),
      buildMission('M3', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.HADERA), UAVType.Surveillance, Priority.High, baseTime, 7, 9, 32.4427, 34.9235, 200),
    ],
  },
  'stress-test': {
    label: 'Stress Test',
    buildMissions: (baseTime: Date): Mission[] => {
      const missions: Mission[] = [];
      for (let index = 1; index <= STRESS_TEST_MISSION_COUNT; index += 1) {
        const requiredUavType = index % 2 === 0 ? UAVType.Armed : UAVType.Surveillance;
        const locationLabel = STRESS_TEST_LOCATION_LABELS[index - 1];
        missions.push(
          buildMission(
            `M${index}`,
            createMissionTitle(requiredUavType, locationLabel, 'near'),
            requiredUavType,
            index % 3 === 0 ? Priority.Low : index % 3 === 1 ? Priority.Medium : Priority.High,
            baseTime,
            index * 0.5,
            (index * 0.5) + 2,
            32.0 + (index * 0.1),
            34.7 + (index * 0.1),
            100 + (index * 10),
          ),
        );
      }
      return missions;
    },
  },
  'parallel-missions-optimization': {
    label: 'Parallel Missions',
    buildMissions: (baseTime: Date): Mission[] => [
      buildMission('M1', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.TEL_AVIV), UAVType.Surveillance, Priority.High, baseTime, 1, 3, 32.0853, 34.7818, 100),
      buildMission('M2', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.JERUSALEM), UAVType.Surveillance, Priority.High, baseTime, 1, 3, 31.7683, 35.2137, 150),
      buildMission('M3', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.HADERA), UAVType.Surveillance, Priority.High, baseTime, 1, 3, 32.4427, 34.9235, 200),
    ],
  },
  'maximum-coverage': {
    label: 'Maximum Coverage',
    buildMissions: (baseTime: Date): Mission[] => [
      buildMission('M1', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.TEL_AVIV), UAVType.Surveillance, Priority.High, baseTime, 1, 3, 32.0853, 34.7818, 100),
      buildMission('M2', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.JERUSALEM), UAVType.Surveillance, Priority.Medium, baseTime, 2, 4, 31.7683, 35.2137, 150),
      buildMission('M3', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.HADERA), UAVType.Surveillance, Priority.Low, baseTime, 3, 5, 32.4427, 34.9235, 200),
      buildMission('M4', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.BEERSHEBA), UAVType.Surveillance, Priority.Medium, baseTime, 4, 6, 31.2530, 34.7915, 120),
      buildMission('M5', createMissionTitle(UAVType.Surveillance, LOCATION_LABELS.HERZLIYA), UAVType.Surveillance, Priority.High, baseTime, 5, 7, 32.1500, 34.8500, 130),
    ],
  },
  'high-priority-reassignment': {
    label: 'High Priority Override',
    buildMissions: (baseTime: Date): Mission[] => [
      buildMission('LowPriorityMission', createMissionTitle(UAVType.Armed, LOCATION_LABELS.TEL_AVIV), UAVType.Armed, Priority.Low, baseTime, 1, 4, 32.0853, 34.7818, 100),
      buildMission('HighPriorityMission', createMissionTitle(UAVType.Armed, LOCATION_LABELS.GUSH_DAN, 'near'), UAVType.Armed, Priority.High, baseTime, 1, 4, 32.1000, 34.8000, 120),
    ],
  },
} as const;

@Injectable({
  providedIn: 'root',
})
export class TestScenarioApiService {
  public getScenarios(): Observable<TestScenario[]> {
    const baseTime = new Date();
    const scenarios: TestScenario[] = Object.entries(SCENARIO_REGISTRY).map(([key, scenario]) => ({
      key,
      label: scenario.label,
      missionCount: scenario.buildMissions(baseTime).length,
    }));

    return of(scenarios);
  }

  public getMissionsForScenarios(scenarios: string[]): Observable<Mission[]> {
    const baseTime = new Date();
    const allMissions: Mission[] = [];

    for (const scenarioKey of scenarios) {
      const scenario = SCENARIO_REGISTRY[scenarioKey as keyof typeof SCENARIO_REGISTRY];
      if (!scenario) {
        continue;
      }

      const missions = scenario.buildMissions(baseTime).map((mission) => {
        const generatedId = createMissionId();

        return {
          ...mission,
          id: generatedId,
        };
      });

      allMissions.push(...missions);
    }

    return of(allMissions);
  }
}

function buildMission(
  id: string,
  title: string,
  requiredUavType: UAVType,
  priority: Priority,
  baseTime: Date,
  startHourOffset: number,
  endHourOffset: number,
  latitude: number,
  longitude: number,
  altitude: number,
): Mission {
  return {
    id,
    title,
    requiredUAVType: requiredUavType,
    priority,
    location: {
      latitude,
      longitude,
      altitude,
    },
    timeWindow: {
      start: new Date(baseTime.getTime() + (startHourOffset * HOUR_IN_MS)),
      end: new Date(baseTime.getTime() + (endHourOffset * HOUR_IN_MS)),
    },
  };
}

function createMissionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createMissionTitle(requiredUavType: UAVType, locationLabel: string, locationRelation: 'at' | 'near' = 'at'): string {
  return `${requiredUavType} ${locationRelation} ${locationLabel}`;
}
