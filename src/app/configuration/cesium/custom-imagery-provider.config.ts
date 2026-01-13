export interface CustomImageryProviderConfig {
  readonly url: string;
  readonly minimumLevel?: number;
  readonly maximumLevel?: number;
  readonly tileWidth?: number;
  readonly tileHeight?: number;
}
