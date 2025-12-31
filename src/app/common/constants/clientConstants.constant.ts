export namespace ClientConstants {
  export namespace ValidationConstants {
    export namespace LocationValidation {
      export const LATITUDE_MIN: number = -90;
      export const LATITUDE_MAX: number = 90;
      export const LONGITUDE_MIN: number = -180;
      export const LONGITUDE_MAX: number = 180;
    }

    export namespace TimeValidation {
      export const HOURS_MIN: number = 0;
      export const HOURS_MAX: number = 23;
      export const MINUTES_MIN: number = 0;
      export const MINUTES_MAX: number = 59;
      export const SECONDS_MIN: number = 0;
      export const SECONDS_MAX: number = 59;
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
      export const CREATE_ASSIGNMENT_SUGGESTION: string = '/api/assignment/create-assignment-suggestion';
      export const APPLY_ASSIGNMENT: string = '/api/assignment/apply-assignment';
      export const GET_ASSIGNMENT_RESULT: string = '/api/assignmentresult';
      export const CHECK_ASSIGNMENT_STATUS: string = '/api/assignmentresult';
      export const GET_ACTIVE_MISSION: string = '/api/mission-status/active-mission';
      export const MISSION_COMPLETED: string = '/api/mission-status/mission-completed';
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
      export const ASSIGNMENT_RESULT_TITLE: string = 'Assignment Result';
    }

    export namespace ErrorMessages {
      export const SUBMIT_MISSIONS_ERROR: string = 'Error submitting missions';
      export const POLL_STATUS_ERROR: string = 'Error polling assignment status';
      export const APPLY_ASSIGNMENT_ERROR: string = 'Error applying assignment';
      export const POLLING_IN_PROGRESS: string = 'Polling in progress';
    }
  }
}
