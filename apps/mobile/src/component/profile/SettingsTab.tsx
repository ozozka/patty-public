/** Source file for SettingsTab. */
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { CardSelector } from 'src/component/common/CardSelector';
import { ListItem } from 'src/component/common/ListItem';
import { useSettingsScenario } from 'src/hooks/scenario/useSettingsScenario';
import {
  Ban,
  Globe,
  Lock,
  LogOut,
  Moon,
  Smartphone,
  Sun,
  Trash2,
} from 'src/lib/icons';
import type { ThemeType } from 'src/types/common';

export function SettingsTab() {
  const { theme: uniTheme } = useUnistyles();
  const {
    navigation,
    t,
    currentLanguageName,
    theme,
    handleLogout,
    handleDeleteAccount,
    handleThemeChange,
  } = useSettingsScenario();

  const themeOptions: {
    value: ThemeType;
    label: string;
    icon: typeof Sun;
  }[] = [
    {
      value: 'light',
      label: t('settings.theme_light'),
      icon: Sun,
    },
    { value: 'dark', label: t('settings.theme_dark'), icon: Moon },
    {
      value: 'system',
      label: t('settings.theme_system'),
      icon: Smartphone,
    },
  ];

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <View style={styles.sectionLabelWrap}>
          <Text style={styles.sectionLabel}>{t('settings.theme')}</Text>
        </View>
        <CardSelector
          testID="settings.theme"
          options={themeOptions}
          selectedValue={theme}
          onSelect={handleThemeChange}
        />
        <View style={styles.spacer} />
        <ListItem
          testID="settings.language"
          title={t('settings.language')}
          subtitle={currentLanguageName}
          onPress={() => navigation.navigate('LanguagePicker')}
          icon={Globe}
          showDivider={false}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionLabelWrap}>
          <Text style={styles.sectionLabel}>{t('settings.privacy')}</Text>
        </View>
        <ListItem
          testID="settings.blocked-accounts"
          title={t('settings.blocked_accounts')}
          onPress={() => navigation.navigate('BlockedAccountsScreen')}
          icon={Ban}
          showDivider={false}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionLabelWrap}>
          <Text style={styles.sectionLabel}>{t('settings.danger_zone')}</Text>
        </View>
        <ListItem
          testID="settings.change-password"
          title={t('settings.change_password')}
          onPress={() => navigation.navigate('ChangePassword')}
          icon={Lock}
        />
        <ListItem
          testID="settings.logout"
          title={t('auth.logout')}
          onPress={handleLogout}
          icon={LogOut}
          iconColor={uniTheme.colors.ERROR}
          titleStyle={styles.dangerTitle}
        />
        <ListItem
          testID="settings.delete-account"
          title={t('settings.delete_account')}
          onPress={handleDeleteAccount}
          titleStyle={styles.dangerTitle}
          icon={Trash2}
          iconColor={uniTheme.colors.ERROR}
          showDivider={false}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing['4xl'],
    paddingHorizontal: theme.spacing['2xl'],
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabelWrap: {
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  sectionLabel: {
    ...theme.typography.label,
    color: theme.colors.TEXT_MUTED,
  },
  spacer: {
    height: theme.spacing.md,
  },
  dangerTitle: {
    ...theme.typography.button,
    color: theme.colors.ERROR,
  },
}));
