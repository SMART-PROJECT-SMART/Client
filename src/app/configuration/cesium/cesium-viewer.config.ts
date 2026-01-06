import type { ImageryProvider, TerrainProvider, SkyBox } from 'cesium';

export interface CesiumViewerConfig {
  readonly imageryProvider?: ImageryProvider | false;
  readonly baseLayerPicker?: boolean;
  readonly geocoder?: boolean;
  readonly homeButton?: boolean;
  readonly sceneModePicker?: boolean;
  readonly selectionIndicator?: boolean;
  readonly timeline?: boolean;
  readonly animation?: boolean;
  readonly navigationHelpButton?: boolean;
  readonly terrainProvider?: TerrainProvider;
  readonly skyBox?: SkyBox | false;
  readonly fullscreenButton?: boolean;
  readonly vrButton?: boolean;
  readonly infoBox?: boolean;
}
