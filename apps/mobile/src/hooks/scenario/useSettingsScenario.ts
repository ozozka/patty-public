/** Scenario hook for settings tab functionality. */
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useLogout } from 'src/hooks/api/useAuthApi';
import { useAlert } from 'src/hooks/ui/useAlert';
import type { ThemeType } from 'src/hooks/ui/useTheme';
import { useTheme } from 'src/hooks/ui/useTheme';
import { useAuthStore } from 'src/store/useAuthStore';
import type { MainStackParamList } from 'src/types/navigation';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const useSettingsScenario = () => {
  const deauthenticate = useAuthStore((state) => state.deauthenticate);
  const logoutMutation = useLogout();
  const { theme, colors, setTheme, syncTheme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { t, i18n } = useTranslation();
  const { show: showAlert } = useAlert();

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    syncTheme(newTheme);
  };

  const handleLogout = () => {
    showAlert(
      t('common.logout_confirm_title'),
      t('common.logout_confirm_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: () => {
            logoutMutation.mutate(undefined, {
              onSuccess: () => deauthenticate(),
              onError: () => deauthenticate(), // always clear local state
            });
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    showAlert(
      t('settings.delete_account_confirm_title'),
      t('settings.delete_account_confirm_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.delete_account'),
          style: 'destructive',
          onPress: () => {
            navigation.navigate('PasswordConfirm');
          },
        },
      ],
    );
  };

  const currentLanguageName =
    i18n.language === 'tr' ? 'Türkçe 🇹🇷' : 'English 🇺🇸';
  const currentThemeName = t(`settings.theme_${theme}`);

  return {
    theme,
    colors,
    navigation,
    t,
    currentLanguageName,
    currentThemeName,
    handleLogout,
    handleDeleteAccount,
    handleThemeChange,
  };
};
