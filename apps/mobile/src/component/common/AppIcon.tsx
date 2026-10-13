/** Source file for AppIcon — renders the app logo from generated PNG. */
import icon from 'assets/icon.png';
import { Image } from 'expo-image';
import { useUnistyles } from 'react-native-unistyles';

export interface AppIconProps {
  /** Optional size override. */
  size?: number;
}

export function AppIcon({ size }: AppIconProps) {
  const { theme } = useUnistyles();
  const iconSize = size ?? theme.sizes.iconLg;

  return (
    <Image
      source={icon}
      style={{
        width: iconSize,
        height: iconSize,
      }}
      contentFit="contain"
    />
  );
}
