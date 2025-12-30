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
}
