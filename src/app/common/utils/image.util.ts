import { PlatformType } from '../enums';
import { ClientConstants } from '../constants/clientConstants.constant';

const { PLATFORM_IMAGES } = ClientConstants.ImagePaths;

export class ImageUtil {
  public static getPlatformImagePath(platformType: PlatformType): string {
    return `${PLATFORM_IMAGES}/${platformType}.png`;
  }
}
