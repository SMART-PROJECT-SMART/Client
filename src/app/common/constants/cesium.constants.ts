export class CesiumConstants {
  public static readonly ION_ACCESS_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4NDNlZTYzYS00Y2JkLTRhYmEtYmRhMC02NTc3NmFiODc0N2IiLCJpZCI6MzMwMTQyLCJpYXQiOjE3Njc2ODg0MzZ9.3mjcPnO_RKNgQsOaEpVAHiLdWMyBeUjno_eNYfXpnBI';
  public static readonly BASE_URL = '/cesium/';
  public static readonly TILE_SERVER_URL = 'http://localhost/tiles/{z}/{x}/{y}.jpg';

  public static readonly DEFAULT_CAMERA_ALTITUDE = 50000;
  public static readonly ISRAEL_CENTER_LONGITUDE = 34.8516;
  public static readonly ISRAEL_CENTER_LATITUDE = 31.0461;

  public static readonly UAV_MODEL_PATH = '/models/UAV.glb';
  public static readonly UAV_MODEL_SCALE = 1.0;
  public static readonly UAV_MODEL_HEADING_OFFSET_RADIANS = 0;
  public static readonly UAV_MODEL_MINIMUM_PIXEL_SIZE = 128;
  public static readonly UAV_MODEL_MAXIMUM_SCALE = 20000;

  public static readonly CAMERA_FLY_DURATION_SECONDS = 2;
  public static readonly CAMERA_UAV_FLY_DURATION_SECONDS = 3;
  public static readonly CAMERA_UAV_HEIGHT_OFFSET = 500;
  public static readonly CAMERA_UAV_PITCH_DEGREES = -45;
  public static readonly CAMERA_UAV_HEADING_DEGREES = 0;
  public static readonly CAMERA_UAV_ROLL = 0;

  public static readonly DEFAULT_IMAGERY_ASSET_ID = 2;

  public static readonly POSITION_INTERPOLATION_DEGREE = 1;
  public static readonly ORIENTATION_INTERPOLATION_DEGREE = 1;
  public static readonly EXTRAPOLATION_DURATION_SECONDS = 2;
  public static readonly SAMPLE_RETENTION_SECONDS = 30;
  public static readonly SAMPLE_TIME_BUFFER_SECONDS = 3;
  public static readonly EPOCH_START_ISO = '1900-01-01';

  public static readonly UAV_MODEL_YAW_ANGLE_CORRECTION_DEGREES = 90;
}
