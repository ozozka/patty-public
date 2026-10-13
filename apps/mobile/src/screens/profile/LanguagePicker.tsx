/** Source file for LanguagePicker. */
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { AppHeader } from 'src/component/common/AppHeader';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { useUpdateProfile } from 'src/hooks/api/useUserApi';
import { Check } from 'src/lib/icons';
import { useAuthStore } from 'src/store/useAuthStore';

const LANGUAGES = [
  { code: 'tr', name: 'Turk\u00e7e', flag: '\ud83c\uddf9\ud83c\uddf7' },
  { code: 'en', name: 'English', flag: '\ud83c\uddfa\ud83c\uddf8' },
];

export function LanguagePicker() {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const navigation = useNavigation();
  const { mutate: updateProfile } = useUpdateProfile();
  const setLanguage = useAuthStore((state) => state.setLanguage);

  const handleSelect = (code: string) => {
    void i18n.changeLanguage(code);
    setLanguage(code);
    updateProfile({ language: code });
    navigation.goBack();
  };

  return (
    <ScreenContainer
      header={<AppHeader title={t('settings.language')} showBack />}
    >
      <ScrollView>
        <View style={styles.listContainer}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageItem,
                i18n.language === lang.code ? styles.selectedItem : null,
              ]}
              onPress={() => handleSelect(lang.code)}
              testID={`language-picker-${lang.code}-button`}
            >
              <View style={styles.languageRow}>
                <View style={styles.flagAndName}>
                  <View style={styles.flagWrap}>
                    <Text style={styles.flagText}>{lang.flag}</Text>
                  </View>
                  <Text style={styles.langName}>{lang.name}</Text>
                </View>
                {i18n.language === lang.code && (
                  <Check color={theme.colors.PRIMARY} size={theme.sizes.icon} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  listContainer: {
    paddingTop: theme.spacing.md,
  },
  languageItem: {
    borderBottomWidth: theme.borderWidth.sm,
    borderBottomColor: theme.colors.BORDER,
  },
  selectedItem: {
    backgroundColor: theme.colors.SURFACE,
  },
  languageRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  flagAndName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagWrap: {
    marginRight: theme.spacing.md,
  },
  flagText: {
    ...theme.typography.body,
    fontSize: theme.sizes.icon,
    color: theme.colors.TEXT,
  },
  langName: {
    ...theme.typography.body,
    color: theme.colors.TEXT,
  },
}));
