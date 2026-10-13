/** Step 3: Location - Province and District selection */
import type { Location } from '@patty/contracts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { SearchableDropdown } from 'src/component/common/SearchableDropdown';
import { MapPin, Navigation as NavigationIcon } from 'src/lib/icons';

interface RegisterStepLocationProps {
  provinces: Location[];
  districts: Location[];
  selectedProvince: Location | null;
  selectedDistrict: Location | null;
  onSelectProvince: (province: Location | null) => void;
  onSelectDistrict: (district: Location | null) => void;
  onAutoDetect: () => Promise<void>;
  isDetecting: boolean;
}

export function RegisterStepLocation({
  provinces,
  districts,
  selectedProvince,
  selectedDistrict,
  onSelectProvince,
  onSelectDistrict,
  onAutoDetect,
  isDetecting,
}: RegisterStepLocationProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.title}>{t('profile.location')}</Text>
      </View>

      <View style={styles.descriptionWrap}>
        <Text style={styles.description}>{t('auth.location_description')}</Text>
      </View>

      <View style={styles.inputsContainer}>
        <SearchableDropdown<Location>
          label={t('profile.province')}
          data={provinces}
          onSelect={onSelectProvince}
          selectedItem={selectedProvince}
          placeholder={t('profile.select_province')}
          labelExtractor={(item) => item.name_tr}
          testID="province-dropdown"
        />

        <SearchableDropdown<Location>
          label={t('profile.district')}
          data={districts}
          onSelect={onSelectDistrict}
          selectedItem={selectedDistrict}
          placeholder={t('profile.select_district')}
          labelExtractor={(item) => item.name_tr}
          testID="district-dropdown"
          disabled={!selectedProvince}
          style={!selectedProvince ? styles.disabledDropdown : undefined}
        />

        <View style={styles.autoDetectWrap}>
          <ActionButton
            testID="location-auto-detect-button"
            onPress={() => void onAutoDetect()}
            title={t('profile.use_current_location')}
            loading={isDetecting}
            type="outline"
            icon={NavigationIcon}
          />
        </View>

        {selectedProvince && (
          <View style={styles.locationBadge}>
            <MapPin size={theme.sizes.icon} color={theme.colors.PRIMARY} />
            <Text style={styles.locationText}>
              {selectedProvince.name_tr}
              {selectedDistrict ? `, ${selectedDistrict.name_tr}` : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    paddingHorizontal: theme.spacing['3xl'],
    paddingTop: theme.spacing.xl,
  },
  headerWrap: {
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.heading,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  descriptionWrap: {
    marginBottom: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.md,
  },
  description: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.TEXT_SECONDARY,
  },
  inputsContainer: {
    gap: theme.spacing.lg,
  },
  autoDetectWrap: {
    marginTop: theme.spacing.lg,
  },
  locationBadge: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.SURFACE_SUNKEN,
    padding: theme.spacing.md,
  },
  locationText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.sm,
    color: theme.colors.TEXT,
  },
  disabledDropdown: {
    opacity: 0.5,
  },
}));
