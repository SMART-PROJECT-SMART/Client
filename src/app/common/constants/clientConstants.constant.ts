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
    export const VIOLATION_TYPE_TIME_OVERLAP_LABEL: string = 'Time overlap';
    export const VIOLATION_TYPE_TYPE_MISMATCH_LABEL: string = 'Type mismatch';
    export const VIOLATION_TYPE_DEFAULT_LABEL: string = 'Violation';
    export const ACTIVE_MISSIONS_LOAD_ERROR_MESSAGE: string = 'Failed to load active missions';
  }

  export namespace ArchiveRoutes {
    export const ARCHIVE: string = '/archive';
    export const INVESTIGATE: string = '/archive/investigate';
    export const INVESTIGATE_PATH_MARKER: string = 'archive/investigate';
  }

  export namespace ArchiveDialogs {
    export const FILTER_WIDTH: string = '380px';
    export const DIFF_WIDTH: string = 'auto';
    export const DIFF_MIN_WIDTH: string = '400px';
    export const DIFF_MAX_WIDTH: string = '900px';
  }

  export namespace TelemetryQueryParams {
    export const MISSION_ID: string = 'missionId';
    export const TAIL_ID: string = 'tailId';
  }

  export namespace ArchiveAPI {
    export const BASE = '/api/archive';
    export const LATEST = `${BASE}/latest`;
    export const BY_DATE = (date: string) => `${BASE}/by-date/${date}`;
    export const BY_MISSION = (missionId: string) => `${BASE}/by-mission/${missionId}`;
  }

  export namespace TelemetryDataAPI {
    export const BASE = '/api/telemetry-data';
    export const QUERY_PAGE = 'page';
    export const QUERY_PAGE_SIZE = 'pageSize';
    export const DEFAULT_PAGE_SIZE: number = 500;
    export const INITIAL_PAGE_INDEX: number = 0;
    export const FIELDS_QUERY_SEPARATOR: string = ',';
    export const MAX_PAGE_FETCH_ITERATIONS: number = 100000;
    export const BOUNDS = (missionId: string, tailId: number) =>
      `${BASE}/bounds?missionId=${encodeURIComponent(missionId)}&tailId=${tailId}`;
    export const BY_MISSION = (
      missionId: string,
      tailId: number,
      fields?: string[],
      startTime?: string,
      endTime?: string,
      page?: number,
      pageSize?: number,
    ) => {
      let url = `${BASE}/by-mission?missionId=${encodeURIComponent(missionId)}&tailId=${tailId}`;
      if (fields?.length) url += `&fields=${fields.join(FIELDS_QUERY_SEPARATOR)}`;
      if (startTime) url += `&startTime=${encodeURIComponent(startTime)}`;
      if (endTime) url += `&endTime=${encodeURIComponent(endTime)}`;
      if (page !== undefined) url += `&${QUERY_PAGE}=${page}`;
      if (pageSize !== undefined) url += `&${QUERY_PAGE_SIZE}=${pageSize}`;
      return url;
    };
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
    export const AMMO_PERCENTAGE: string = '%';
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
    export const CROSSHAIR_PLUGIN_ID: string = 'syncedCrosshair';
    export const TIME_AXIS_LABEL: string = 'Time (s)';
    export const X_SCALE_ID: string = 'x';
    export const Y_SCALE_ID: string = 'y';
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

  export namespace TelemetryPageMessages {
    export const NO_MISSION_ID: string = 'No mission ID provided.';
    export const LOAD_FAILED: string = 'Failed to load telemetry data.';
  }

  export namespace TelemetryInvestigationUi {
    export const TIME_RANGE_OVERLAY_MIN_WIDTH: string = 'min(100vw - 32px, 560px)';
    export const TIME_RANGE_OVERLAY_PANEL_CLASS: string = 'time-range-overlay-panel';
    export const TIME_RANGE_OVERLAY_BACKDROP_CLASS: string = 'cdk-overlay-transparent-backdrop';
    export const FETCH_OVERLAY_SPINNER_DIAMETER: number = 32;
    export const TABLE_ROW_TRACK_ID_SEPARATOR: string = '|';
    export const ROW_RANGE_ZERO_ROWS: string = '0 rows';
    export const TIMESTAMP_TABLE_HEADER: string = 'Timestamp';
    export const PARAMETER_SEARCH_PLACEHOLDER: string = 'Search parameters...';
    export const MISSION_DETAILS_LABEL: string = 'Mission Details';
    export const EMPTY_STATE_TITLE: string = 'No Parameters Selected';
    export const EMPTY_STATE_HINT: string = 'Add telemetry parameters to start investigating';
    export const ADD_PARAMETER_LABEL: string = 'Add Parameter';
    export const TAIL_LABEL_PREFIX: string = 'Tail ';
    export const BACK_ARIA_LABEL: string = 'Back to archive';
    export const TABLE_VALUE_NUMBER_FORMAT: string = '1.0-2';
    export const DATETIME_LOCAL_PAD_LENGTH: number = 2;
    export const DATETIME_PAD_CHAR: string = '0';
    export const TOOLTIP_TIME_RANGE: string = 'Click to change time range';
    export const TOOLTIP_RESET_RANGE: string = 'Reset to full range';
    export const MENU_SHOW_AS_TABLE: string = 'Show as Table';
    export const MENU_SHOW_AS_CHART: string = 'Show as Chart';
    export const BOUNDS_DISPLAY_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    export const BOUNDS_DISPLAY_FORMAT_OPTIONS_UTC: Intl.DateTimeFormatOptions = {
      ...BOUNDS_DISPLAY_FORMAT_OPTIONS,
      timeZone: 'UTC',
    };
    export const INVESTIGATION_DISPLAY_TIME_ZONE: string = 'Asia/Jerusalem';
    export const BOUNDS_DISPLAY_FORMAT_OPTIONS_INVESTIGATION: Intl.DateTimeFormatOptions = {
      ...BOUNDS_DISPLAY_FORMAT_OPTIONS,
      timeZone: INVESTIGATION_DISPLAY_TIME_ZONE,
    };
    export const BOUNDS_DISPLAY_RANGE_SEPARATOR: string = '\u2014';
  }

  export namespace GridsterDashboard {
    export const DEFAULT_COLUMNS: number = 2;
    export const DEFAULT_ITEM_COLS: number = 1;
    export const DEFAULT_ITEM_ROWS: number = 1;
    export const FIXED_ROW_HEIGHT: number = 250;
    export const MARGIN: number = 8;
    export const MIN_ITEM_COLS: number = 1;
    export const MIN_ITEM_ROWS: number = 1;
    export const DRAG_HANDLE_CLASS: string = 'drag-handle';
    export const NO_DRAG_CLASS: string = 'no-drag';
    export const VIEW_MODE_CHART: string = 'chart';
    export const VIEW_MODE_TABLE: string = 'table';
    export const TILE_HEADER_HEIGHT: number = 38;
    export const TABLE_HEADER_HEIGHT: number = 26;
    export const PAGINATION_HEIGHT: number = 38;
    export const TABLE_ROW_HEIGHT: number = 28;
    export const MIN_PAGE_SIZE: number = 1;
    export const PAGE_SIZE_OPTIONS: number[] = [5, 10, 25, 50];
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
    export const TIMESTAMP_COLUMN: string = 'timestamp';
  }

  export namespace AssignmentReviewMap {
    export const DEFAULT_CENTER_LAT = 31.5;
    export const DEFAULT_CENTER_LON = 34.8;
    export const DEFAULT_ZOOM = 8;
    export const FIT_PADDING_PX = 40;
    export const UAV_ICON_WIDTH_PX = 36;
    export const UAV_ICON_HEIGHT_PX = 40;
    export const MISSION_ICON_WIDTH_PX = 36;
    export const MISSION_ICON_HEIGHT_PX = 40;
    export const LINE_WEIGHT = 3;
    export const LINE_OPACITY = 0.85;
    export const FILTER_DIMMED_OPACITY = 0.25;
    export const FILTER_FULL_OPACITY = 1.0;
    export const LINE_SATURATION_PERCENT = 70;
    export const LINE_LIGHTNESS_PERCENT = 40;
    export const UAV_COLOR_UNASSIGNED = '#9e9e9e';
    export const DEFAULT_UAV_ACCENT = '#1976d2';
    export const DEFAULT_MISSION_ACCENT = '#5e35b1';
    export const ACTIVE_MISSION_BADGE_TEXT = 'M';
    export const ACTIVE_MISSION_BADGE_BG_COLOR = '#00bcd4';
    export const ACTIVE_MISSION_BADGE_TEXT_COLOR = '#ffffff';
    export const ACTIVE_MISSION_BADGE_SIZE_PX = 16;
    export const ACTIVE_MISSION_BADGE_FONT_SIZE_PX = 10;
    export const PRIORITY_HIGH_OUTLINE_COLOR = '#d32f2f';
    export const PRIORITY_MEDIUM_OUTLINE_COLOR = '#f9a825';
    export const PRIORITY_LOW_OUTLINE_COLOR = '#2e7d32';
    export const PRIORITY_OUTLINE_DEFAULT_COLOR = '#757575';
    export const MISSION_PRIORITY_OUTLINE_WIDTH_PX = 4;
    export const ICON_WRAPPER_CLASS = 'ar-map-div-icon';
    export const UAV_ICON_CLASS = 'ar-map-icon ar-map-icon--uav';
    export const MISSION_ICON_CLASS = 'ar-map-icon ar-map-icon--mission';
    export const TOOLTIP_UAV_PREFIX = 'UAV ';
    export const TOOLTIP_POSITION_SECTION_TITLE = 'Position';
    export const TOOLTIP_STATUS_SECTION_TITLE = 'Status';
    export const TOOLTIP_ACTIVE_MISSION_SECTION_TITLE = 'Active mission';
    export const TOOLTIP_ACTIVE_MISSION_MISSION_LABEL = 'Mission';
    export const TOOLTIP_TOOLTIP_CLASS = 'ar-map-tooltip';
    export const TOOLTIP_VALUE_DEGREE_SUFFIX = '°';
    export const TOOLTIP_ROW_SEPARATOR = ':';
    export const TOOLTIP_TYPE_BADGE_CLASS = 'ar-map-tooltip__type';
    export const TOOLTIP_VALUE_UNAVAILABLE = 'N/A';
    export const TOOLTIP_LINE_BREAK = '<br />';
    export const TOOLTIP_VALUE_SPACE = ' ';
    export const TOOLTIP_VALUE_DECIMALS = 2;
    export const TOOLTIP_LAT_LON_DECIMALS = 6;
    export const TOOLTIP_STATUS_VALUE_DECIMALS = 1;
    export const TOOLTIP_TOOLTIP_OFFSET_X_PX = 12;
    export const TOOLTIP_TOOLTIP_OFFSET_Y_PX = -16;
    export const TOOLTIP_MISSION_SUFFIX_OPEN = ' (';
    export const TOOLTIP_MISSION_SUFFIX_CLOSE = ')';
    export const TOOLTIP_MISSION_PRIORITY_LABEL = 'Priority';
    export const TOOLTIP_MISSION_LOCATION_LABEL = 'Location';
    export const TOOLTIP_MISSION_ALTITUDE_LABEL = 'Alt';
    export const TOOLTIP_MISSION_LATITUDE_LABEL = 'Lat';
    export const TOOLTIP_MISSION_LONGITUDE_LABEL = 'Lon';
    export const TOOLTIP_MISSION_COORDINATE_SEPARATOR = ', ';
    export const TOOLTIP_MISSION_KEY_VALUE_SEPARATOR = ': ';
    export const TOOLTIP_MISSION_LOCATION_PART_SEPARATOR = ' ';
    export const GLYPH_SIZE_PX = 22;
    export const GLYPH_CLASS = 'ar-map-glyph';
    export const GLYPH_UAV_CLASS = 'ar-map-glyph--uav';
    export const GLYPH_MISSION_SURVEILLANCE_CLASS = 'ar-map-glyph--mission-surveillance';
    export const GLYPH_MISSION_ARMED_CLASS = 'ar-map-glyph--mission-armed';
    export const UAV_ICON_ASSET_URL = '/icons/map/uav.svg';
    export const MISSION_SURVEILLANCE_ICON_ASSET_URL = '/icons/map/mission-surveillance.svg';
    export const MISSION_ARMED_ICON_ASSET_URL = '/icons/map/mission-armed.svg';
    export const LINE_HUES: readonly number[] = [200, 220, 240, 260, 280, 300];
    export const OS_TILE_TEMPLATE =
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    export const TILE_ATTRIBUTION =
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
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
