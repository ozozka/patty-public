/** Component for hierarchical location selection (Province -> District) */
import type { Location } from '@patty/contracts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ModalContainer } from 'src/component/common/ModalContainer';
import { useLocationPicker } from 'src/hooks/feature/useLocationPicker';
import { MapPin, Navigation } from 'src/lib/icons';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: Location) => void;
  initialLocationId?: number | null;
}

export function LocationPickerModal({
  visible,
  onClose,
  onSelect,
  initialLocationId,
}: LocationPickerModalProps) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  const {
    provinces,
    districts,
    selectedProvince,
    selectedDistrict,
    isDetecting,
    selectProvince,
    selectDistrict,
    handleAutoDetect,
  } = useLocationPicker({
    initialLocationId,
    onSelect: (loc) => {
      onSelect(loc);
      onClose();
    },
  });

  const renderItem = (
    item: Location,
    onPress: () => void,
    isSelected: boolean,
  ) => (
    <TouchableOpacity
      key={item.id}
      testID={`location-picker-item-${item.id}`}
      onPress={onPress}
      style={[
        styles.item,
        isSelected && styles.itemSelected,
        { borderBottomColor: theme.colors.BORDER },
      ]}
    >
      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemText,
            { color: isSelected ? theme.colors.PRIMARY : theme.colors.TEXT },
          ]}
        >
          {item.name_tr}
        </Text>
        {isSelected && (
          <MapPin size={theme.sizes.icon} color={theme.colors.PRIMARY} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ModalContainer
      visible={visible}
      onRequestClose={onClose}
      maxHeight="70%"
      keyboardMode="none"
      backdropColor="rgba(0, 0, 0, 0.5)"
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.TEXT }]}>
            {t('profile.location')}
          </Text>
          <TouchableOpacity
            testID="location-picker-close-button"
            onPress={onClose}
          >
            <Text style={styles.closeButton}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detectionButtonWrap}>
          <TouchableOpacity
            testID="location-picker-current-location"
            onPress={() => void handleAutoDetect()}
            disabled={isDetecting}
          >
            <View style={styles.detectionButton}>
              <View style={styles.detectionButtonContent}>
                {isDetecting ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.PRIMARY}
                  />
                ) : (
                  <>
                    <Navigation
                      size={theme.sizes.icon}
                      color={theme.colors.PRIMARY}
                    />
                    <Text style={styles.detectionButtonText}>
                      {t('profile.use_current_location')}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.breadcrumb}>
          <TouchableOpacity
            testID="location-picker-all-turkey"
            onPress={() => selectProvince(null)}
          >
            <Text
              style={[
                styles.breadcrumbText,
                !selectedProvince
                  ? styles.breadcrumbTextActive
                  : styles.breadcrumbTextInactive,
              ]}
            >
              {t('location.all_turkey')}
            </Text>
          </TouchableOpacity>
          {selectedProvince && (
            <>
              <View style={styles.breadcrumbSeparator}>
                <Text style={styles.breadcrumbSeparatorText}>
                  {t('common.separator_slash')}
                </Text>
              </View>
              <TouchableOpacity
                testID="location-picker-clear-district"
                onPress={() => selectDistrict(null)}
              >
                <Text style={styles.breadcrumbLink}>
                  {selectedProvince.name_tr}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <ScrollView>
          <View>
            {!selectedProvince ? (
              provinces.map((p) =>
                renderItem(p, () => selectProvince(p), false),
              )
            ) : (
              <>
                {renderItem(
                  selectedProvince,
                  () => selectDistrict(null),
                  !selectedDistrict,
                )}
                {districts.map((d) =>
                  renderItem(
                    d,
                    () => selectDistrict(d),
                    selectedDistrict?.id === d.id,
                  ),
                )}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </ModalContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  content: {
    marginTop: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  title: {
    ...theme.typography.heading,
  },
  closeButton: {
    ...theme.typography.button,
    color: theme.colors.PRIMARY,
  },
  detectionButtonWrap: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  detectionButton: {
    borderRadius: theme.borderRadius.full,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.PRIMARY,
    padding: theme.spacing.md,
  },
  detectionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  detectionButtonText: {
    ...theme.typography.button,
    color: theme.colors.PRIMARY,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  breadcrumbText: {
    ...theme.typography.caption,
  },
  breadcrumbTextActive: {
    color: theme.colors.PRIMARY,
  },
  breadcrumbTextInactive: {
    color: theme.colors.TEXT_MUTED,
  },
  breadcrumbSeparator: {
    marginHorizontal: theme.spacing.xs,
  },
  breadcrumbSeparatorText: {
    ...theme.typography.caption,
    color: theme.colors.TEXT_MUTED,
  },
  breadcrumbLink: {
    ...theme.typography.caption,
    color: theme.colors.PRIMARY,
  },
  item: {
    borderBottomWidth: theme.borderWidth.sm,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  itemSelected: {
    backgroundColor: theme.colors.SURFACE_ELEVATED,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemText: {
    ...theme.typography.body,
  },
}));
