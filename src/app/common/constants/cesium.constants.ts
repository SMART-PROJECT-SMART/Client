export class CesiumConstants {
  public static readonly ION_ACCESS_TOKEN = process.env['CESIUM_ION_ACCESS_TOKEN']!;
  public static readonly BASE_URL = process.env['CESIUM_BASE_URL']!;
  public static readonly TILE_SERVER_URL = process.env['CESIUM_TILE_SERVER_URL']!;

  public static readonly DEFAULT_CAMERA_ALTITUDE = 50000;
  public static readonly ISRAEL_CENTER_LONGITUDE = 34.8516;
  public static readonly ISRAEL_CENTER_LATITUDE = 31.0461;

  public static readonly UAV_MODEL_PATH = '/models/UAV.glb';
  public static readonly UAV_MODEL_SCALE = 1.0;
  public static readonly UAV_MODEL_ROTATION_DEGREES = 180;
  public static readonly UAV_MODEL_MINIMUM_PIXEL_SIZE = 128;
  public static readonly UAV_MODEL_MAXIMUM_SCALE = 20000;

  public static readonly CAMERA_FLY_DURATION_SECONDS = 2;
  public static readonly CAMERA_UAV_FLY_DURATION_SECONDS = 3;
  public static readonly CAMERA_UAV_HEIGHT_OFFSET = 500;
  public static readonly CAMERA_UAV_PITCH_DEGREES = -45;
  public static readonly CAMERA_UAV_HEADING_DEGREES = 0;
  public static readonly CAMERA_UAV_ROLL = 0;

  public static readonly DEFAULT_IMAGERY_ASSET_ID = 2;
}
