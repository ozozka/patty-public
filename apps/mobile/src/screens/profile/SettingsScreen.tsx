/** Source file for SettingsScreen. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { AppHeader } from 'src/component/common/AppHeader';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { SettingsTab } from 'src/component/profile/SettingsTab';

export function SettingsScreen() {
  const { t } = useTranslation();

  return (
    <ScreenContainer
      style={styles.container}
      header={<AppHeader title={t('profile.tab_settings')} showBack />}
    >
      <SettingsTab />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.SURFACE_SUNKEN,
  },
}));
