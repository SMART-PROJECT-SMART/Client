export namespace ClientConstants {
  export namespace ValidationConstants {
    export namespace LocationValidation {
      export const LATITUDE_MIN: number = -90;
      export const LATITUDE_MAX: number = 90;
      export const LONGITUDE_MIN: number = -180;
      export const LONGITUDE_MAX: number = 180;
    }

    export namespace MissionBounds {
      export const LATITUDE_MIN: number = 29.5;
      export const LATITUDE_MAX: number = 33.3;
      export const LONGITUDE_MIN: number = 34.2;
      export const LONGITUDE_MAX: number = 35.9;
    }

    export namespace TimeValidation {
      export const HOURS_MIN: number = 0;
      export const HOURS_MAX: number = 23;
      export const MINUTES_MIN: number = 0;
      export const MINUTES_MAX: number = 59;
      export const SECONDS_MIN: number = 0;
      export const SECONDS_MAX: number = 59;
      export const MINIMUM_MISSION_DURATION_MINUTES: number = 30;
      export const TIME_FORMAT_PATTERN: RegExp = /^([01]\d|2[0-3]):([0-5]\d)$/;
    }

    export namespace MissionValidation {
      export const TITLE_MAX_LENGTH: number = 60;
    }
  }

  export namespace FormDefaults {
    export const EMPTY_STRING: string = '';
    export const DEFAULT_NUMBER: number = 0;
  }

  export namespace AssignmentPageConstants {
    export const ADD_MISSION_LABEL: string = 'Add Mission';
    export const SUBMIT_LABEL: string = 'Submit';
    export const APPLY_LABEL: string = 'Apply';
    export const BACK_LABEL: string = 'Back';
    export const NO_ASSIGNMENT_LABEL: string = 'Unassigned';
  }

  export namespace ArchiveAPI {
    export const BASE = '/api/archive';
    export const LATEST = `${BASE}/latest`;
    export const BY_DATE = (date: string) => `${BASE}/by-date/${date}`;
  }

  export namespace TelemetryDataAPI {
    export const BASE = '/api/telemetry-data';
    export const BY_MISSION = (missionId: string, tailId: number) =>
      `${BASE}/by-mission?missionId=${missionId}&tailId=${tailId}`;
  }

  export namespace MissionServiceAPI {
    export namespace Controllers {
      export const ASSIGNMENT: string = 'assignment';
      export const ASSIGNMENT_RESULT: string = 'assignmentresult';
      export const MISSION_STATUS: string = 'mission-status';
    }

    export namespace Actions {
      export const CREATE_ASSIGNMENT_SUGGESTION: string = 'create-assignment-suggestion';
      export const APPLY_ASSIGNMENT: string = 'apply-assignment';
      export const GET_RESULT: string = '';
      export const CHECK_STATUS: string = 'status';
      export const GET_ACTIVE_MISSION: string = 'active-mission';
      export const MISSION_COMPLETED: string = 'mission-completed';
    }

    export namespace Endpoints {
      export const CREATE_ASSIGNMENT_SUGGESTION: string =
        '/api/assignment/create-assignment-suggestion';
      export const APPLY_ASSIGNMENT: string = '/api/assignment/apply-assignment';
      export const GET_ASSIGNMENT_RESULT: string = '/api/assignmentresult';
      export const CHECK_ASSIGNMENT_STATUS: string = '/api/assignmentresult';
      export const GET_ACTIVE_MISSION: string = '/api/mission-status/active-mission';
      export const GET_ALL_ACTIVE_MISSIONS: string = '/api/mission-status/active-missions';
      export const MISSION_COMPLETED: string = '/api/mission-status/mission-completed';
      export const GET_TEST_SCENARIOS: string = '/api/test/scenarios';
      export const GET_SCENARIO_MISSIONS: string = '/api/test/scenarios/missions';
    }

    export namespace PollingConstants {
      export const POLLING_INTERVAL_MS: number = 1000;
    }

    export namespace Messages {
      export const PROCESSING_MESSAGE: string = 'Processing assignment suggestions...';
      export const SUBMIT_ERROR: string = 'Failed to submit missions. Please try again.';
      export const STATUS_ERROR: string = 'Failed to check assignment status. Please try again.';
      export const RESULT_ERROR: string = 'Failed to fetch assignment result. Please try again.';
      export const APPLY_ERROR: string = 'Failed to apply assignment. Please try again.';
      export const SUCCESS_MESSAGE: string = 'Assignment suggestion completed successfully!';
      export const APPLY_SUCCESS_MESSAGE: string = 'Assignment applied successfully!';
      export const ASSIGNMENT_RESULT_TITLE: string = 'Assignment Result';
      export const SNACKBAR_CLOSE_ACTION: string = 'Close';
    }

    export namespace SnackbarConfig {
      export const DURATION_MS: number = 5000;
      export const HORIZONTAL_POSITION: string = 'center';
      export const VERTICAL_POSITION: string = 'top';
    }

    export namespace ErrorMessages {
      export const SUBMIT_MISSIONS_ERROR: string = 'Error submitting missions';
      export const POLL_STATUS_ERROR: string = 'Error polling assignment status';
      export const APPLY_ASSIGNMENT_ERROR: string = 'Error applying assignment';
      export const POLLING_IN_PROGRESS: string = 'Polling in progress';
    }
  }

  export namespace SidebarConstants {
    export const LOGO_PATH: string = 'images/logo.png';
  }

  export namespace ImagePaths {
    export const PLATFORM_IMAGES: string = 'images/platforms';
  }

  export namespace DialogConfig {
    export const MISSION_DIALOG_WIDTH: string = '600px';
    export const MISSION_SUMMARY_DIALOG_WIDTH: string = '500px';
    export const DEVICE_DIALOG_WIDTH: string = '500px';
    export const CONFIRMATION_DIALOG_WIDTH: string = '400px';
    export const PANEL_CLASS: string = 'mission-dialog';
    export const SCENARIO_DIALOG_WIDTH: string = '600px';
  }

  export namespace SnackbarConfig {
    export const DURATION_MS = 5000;
    export const HORIZONTAL_POSITION = 'center' as const;
    export const VERTICAL_POSITION = 'top' as const;
    export const CLOSE_ACTION = 'Close';
  }

  export namespace TelemetryUnits {
    export const DRAG_COEFFICIENT: string = 'coeff';
    export const LIFT_COEFFICIENT: string = 'coeff';
    export const THROTTLE_PERCENT: string = '%';
    export const CRUISE_ALTITUDE: string = 'm';
    export const LATITUDE: string = 'deg';
    export const LANDING_GEAR_STATUS: string = 'bool';
    export const LONGITUDE: string = 'deg';
    export const ALTITUDE: string = 'm';
    export const CURRENT_SPEED_KMPH: string = 'kmph';
    export const YAW_DEG: string = 'deg';
    export const PITCH_DEG: string = 'deg';
    export const ROLL_DEG: string = 'deg';
    export const THRUST_AFTER_INFLUENCE: string = 'N';
    export const FUEL_AMOUNT: string = '%';
    export const DATA_STORAGE_USED_GB: string = 'GB';
    export const FLIGHT_TIME_SEC: string = 'sec';
    export const SIGNAL_STRENGTH: string = 'dBm';
    export const RPM: string = 'rpm';
    export const ENGINE_DEGREES: string = '°C';
    export const NEAREST_SLEEVE_ID: string = 'id';
    export const TAIL_ID: string = 'id';
    export const UAV_TYPE_VALUE: string = 'enum';
    export const PLATFORM_TYPE: string = 'enum';
    export const MISSION_ID: string = 'hash';
  }
  export namespace ChartConfig {
    export const COLORS: string[] = [
      '#ab47bc', '#42a5f5', '#66bb6a', '#ffa726', '#ef5350',
      '#26c6da', '#ffee58', '#8d6e63', '#78909c', '#ec407a',
      '#7e57c2', '#29b6f6', '#9ccc65', '#ffca28', '#ff7043',
      '#26a69a', '#d4e157', '#5c6bc0', '#ff8a65', '#bdbdbd',
    ];
    export const BACKGROUND_ALPHA: string = '33';
    export const POINT_RADIUS: number = 0;
    export const BORDER_WIDTH: number = 1.5;
    export const LINE_TENSION: number = 0.3;
    export const X_AXIS_MAX_TICKS: number = 20;
    export const Y_AXIS_MAX_TICKS: number = 5;
    export const TICK_FONT_SIZE: number = 10;
    export const TICK_COLOR: string = '#c0c0c0';
    export const GRID_COLOR: string = 'rgba(68, 68, 68, 0.3)';
    export const CROSSHAIR_COLOR: string = 'rgba(245, 245, 245, 0.4)';
    export const CROSSHAIR_WIDTH: number = 1;
  }

  export namespace TimeFormat {
    export const LOCALE: string = 'en-US';
    export const OPTIONS: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
  }

  export namespace DeviceManagementConstants {
    export const PAGE_TITLE: string = 'Device Management';
    export const ADD_UAV_LABEL: string = 'Add UAV';
    export const ADD_SLEEVE_LABEL: string = 'Add Sleeve';
    export const DELETE_CONFIRM_TITLE: string = 'Confirm Deletion';
  }
  export namespace DeviceValidationConstants {
    export const PORT_NUMBER_MIN: number = 1024;
    export const PORT_NUMBER_MAX: number = 65535;
    export const TAIL_ID_MIN: number = 1;
    export const TAIL_ID_MAX: number = 9999;
    export const SLEEVE_NAME_MIN_LENGTH: number = 3;
    export const SLEEVE_NAME_MAX_LENGTH: number = 50;
    export const SLEEVE_PORT_COUNT: number = 2;
  }
  export namespace DeviceServiceAPI {
    export namespace Endpoints {
      export const UAV_BASE: string = '/api/uav';
      export const SLEEVE_BASE: string = '/api/sleeve';
    }
    export namespace Messages {
      export const UAV_CREATE_SUCCESS: string = 'UAV created successfully';
      export const UAV_UPDATE_SUCCESS: string = 'UAV updated successfully';
      export const UAV_DELETE_SUCCESS: string = 'UAV deleted successfully';
      export const SLEEVE_CREATE_SUCCESS: string = 'Sleeve created successfully';
      export const SLEEVE_UPDATE_SUCCESS: string = 'Sleeve updated successfully';
      export const SLEEVE_DELETE_SUCCESS: string = 'Sleeve deleted successfully';
      export const OPERATION_ERROR: string = 'Operation failed. Please try again.';
    }
  }

  export namespace TableConfig {
    export const DEFAULT_PAGE_SIZE: number = 10;
    export const PAGE_SIZE_OPTIONS: number[] = [5, 10, 25, 50];
  }

  export namespace BaseLocationConfig {
    export interface Coordinates {
      latitude: number;
      longitude: number;
      altitude: number;
    }

    export const COORDINATES: Record<string, Coordinates> = {
      Hatzerim: { latitude: 31.2333, longitude: 34.6625, altitude: 220 },
      TelNof: { latitude: 31.8394, longitude: 34.8217, altitude: 59 },
      RamatDavid: { latitude: 32.6656, longitude: 35.1817, altitude: 56 },
      Nevatim: { latitude: 31.2083, longitude: 35.0122, altitude: 400 },
      Ramon: { latitude: 30.7761, longitude: 34.6667, altitude: 648 },
      Hatzor: { latitude: 31.7625, longitude: 34.7272, altitude: 45 },
      Palmachim: { latitude: 31.8978, longitude: 34.6906, altitude: 10 },
      Ovda: { latitude: 29.94, longitude: 34.9358, altitude: 455 },
    };

    export const getCoordinates = (baseLocation: string): Coordinates => COORDINATES[baseLocation];

    export const getBaseFromCoordinates = (coords: Coordinates): string | null => {
      const tolerance = 0.01;
      for (const [base, baseCoords] of Object.entries(COORDINATES)) {
        if (
          Math.abs(coords.latitude - baseCoords.latitude) < tolerance &&
          Math.abs(coords.longitude - baseCoords.longitude) < tolerance
        ) {
          return base;
        }
      }
      return null;
    };
  }
}
