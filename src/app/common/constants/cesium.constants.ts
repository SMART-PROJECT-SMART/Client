export class CesiumConstants {
  public static readonly ION_ACCESS_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3M2ZiOTI1My03YjdmLTRlZjItOWQ0MS0yN2IxYWNiZWU1MDQiLCJpZCI6MzMwMTQyMSwiaWF0IjoxNzMzNzU1OTYyfQ.X72bwNfS3N7uuYWb_aNIUtpn8sCQb8R5-jP0XQMxHcc';
  public static readonly BASE_URL = '/cesium/';
  public static readonly TILE_SERVER_URL = 'http://localhost/tiles/{z}/{x}/{y}.jpg';

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
