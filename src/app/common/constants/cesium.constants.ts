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
}
