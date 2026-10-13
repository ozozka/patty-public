import type { ProfileResponse } from '@patty/contracts';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { OtpInput } from 'src/component/auth/OtpInput';
import { ActionButton } from 'src/component/common/ActionButton';
import { AppHeader } from 'src/component/common/AppHeader';
import { AvatarImage } from 'src/component/common/AvatarImage';
import { ControlledInput } from 'src/component/common/ControlledInput';
import { Dialog } from 'src/component/common/Dialog';
import { PhoneInput } from 'src/component/common/PhoneInput';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { LocationPickerModal } from 'src/component/profile/LocationPickerModal';
import { useEditProfileScenario } from 'src/hooks/scenario/useEditProfileScenario';
import { BadgeCheck, MapPin } from 'src/lib/icons';
import type { MainStackParamList } from 'src/types/navigation';

type NavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'EditProfile'
>;

export function EditProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useUnistyles();

  const {
    control,
    handleSave,
    phoneNumber,
    setPhoneNumber,
    sharePhoneWithMatches,
    setSharePhoneWithMatches,
    isPhoneVerified,
    selectedLocation,
    setSelectedLocation,
    pickImage,
    handleVerifyEmailCode: handleVerifyEmailCodeHook,
    isPending,
    imageUri,
    emailWatch,
    initialEmail,
  } = useEditProfileScenario();

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] =
    useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');

  const emailChanged = emailWatch !== initialEmail;

  const onSavePress = async () => {
    if (emailChanged) {
      await handleSave();
      setShowEmailVerificationModal(true);
    } else {
      await handleSave();
    }
  };

  const handleVerifyEmailCode = async () => {
    try {
      await handleVerifyEmailCodeHook(emailVerificationCode);
      setShowEmailVerificationModal(false);
      navigation.goBack();
    } catch {
      // Error handled in scenario hook
    }
  };

  return (
    <ScreenContainer
      header={
        <AppHeader
          title={t('profile.edit_profile')}
          showBack
          rightElement={
            isPending ? (
              <ActivityIndicator color={theme.colors.PRIMARY} size="small" />
            ) : (
              <TouchableOpacity
                onPress={() => void onSavePress()}
                testID="edit-profile-save-button"
              >
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            )
          }
        />
      }
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={() => void pickImage()}
            testID="edit-profile-avatar-button"
          >
            <AvatarImage
              uri={imageUri}
              onPress={() => void pickImage()}
              showBadge
              size={120}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={() => void pickImage()}
            testID="edit-profile-change-photo-button"
          >
            <Text style={styles.changePhotoText}>
              {t('profile.change_photo')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputsContainer}>
          <ControlledInput<ProfileResponse>
            name="first_name"
            control={control}
            label={t('auth.first_name')}
            placeholder={t('auth.first_name')}
            rules={{ required: t('common.required') }}
            autoCapitalize="words"
          />

          <ControlledInput<ProfileResponse>
            name="email"
            control={control}
            label={t('auth.email')}
            placeholder={t('auth.email')}
            rules={{
              required: t('common.required'),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: t('auth.invalid_email'),
              },
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailChanged && (
            <Text style={styles.emailChangeNotice}>
              {t('profile.email_change_verification_notice')}
            </Text>
          )}

          <ControlledInput<ProfileResponse>
            name="bio"
            control={control}
            label={t('profile.bio')}
            placeholder={t('profile.bio')}
          />

          <View>
            <PhoneInput
              phoneNumber={phoneNumber}
              onChangePhoneNumber={setPhoneNumber}
              label={t('profile.phone')}
              rightElement={
                isPhoneVerified ? (
                  <BadgeCheck
                    color={theme.colors.PRIMARY}
                    size={theme.sizes.icon}
                  />
                ) : undefined
              }
            />
          </View>

          {isPhoneVerified && (
            <View style={styles.sharePhoneRow}>
              <Text style={styles.sharePhoneText}>
                {t('profile.share_phone')}
              </Text>
              <Switch
                value={sharePhoneWithMatches}
                onValueChange={setSharePhoneWithMatches}
                trackColor={{ true: theme.colors.PRIMARY }}
              />
            </View>
          )}

          <View>
            <Text style={styles.locationLabel}>{t('profile.location')}</Text>
            <TouchableOpacity
              onPress={() => setLocationModalVisible(true)}
              style={styles.locationPicker}
              testID="edit-profile-location-picker"
            >
              <View style={styles.locationPickerContent}>
                <Text
                  style={
                    selectedLocation
                      ? styles.locationTextSelected
                      : styles.locationTextPlaceholder
                  }
                >
                  {selectedLocation
                    ? selectedLocation.name_tr
                    : t('profile.location')}
                </Text>
                <MapPin color={theme.colors.PRIMARY} size={theme.sizes.icon} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.saveButtonWrap}>
          <ActionButton
            title={t('common.save')}
            onPress={() => void onSavePress()}
            loading={isPending}
            testID="edit-profile-save-bottom-button"
          />
        </View>

        <LocationPickerModal
          visible={locationModalVisible}
          onClose={() => setLocationModalVisible(false)}
          onSelect={setSelectedLocation}
          initialLocationId={selectedLocation?.id}
        />

        <Dialog
          visible={showEmailVerificationModal}
          title={t('auth.verify_your_email')}
          message={t('auth.verification_code_sent_description')}
          onClose={() => setShowEmailVerificationModal(false)}
          buttons={[]}
        >
          <View style={styles.verificationModalContent}>
            <OtpInput
              value={emailVerificationCode}
              onChange={setEmailVerificationCode}
              disabled={isPending}
            />
            <View style={styles.verifyButtonWrap}>
              <ActionButton
                title={t('common.verify')}
                onPress={() => void handleVerifyEmailCode()}
                loading={isPending}
                disabled={emailVerificationCode.length < 6}
                testID="edit-profile-verify-email-button"
              />
            </View>
          </View>
        </Dialog>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.xl,
  },
  saveButtonText: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: theme.colors.PRIMARY,
  },
  avatarContainer: {
    marginBottom: theme.spacing['2xl'],
    alignSelf: 'center',
  },
  changePhotoButton: {
    marginTop: theme.spacing.sm,
  },
  changePhotoText: {
    ...theme.typography.bodySmall,
    textAlign: 'center',
    fontWeight: 'bold',
    color: theme.colors.PRIMARY,
  },
  inputsContainer: {
    gap: theme.spacing.md,
  },
  emailChangeNotice: {
    ...theme.typography.caption,
    marginTop: -theme.spacing.sm,
    color: theme.colors.PRIMARY,
  },
  sharePhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  sharePhoneText: {
    ...theme.typography.body,
    color: theme.colors.TEXT,
  },
  locationLabel: {
    ...theme.typography.label,
    marginBottom: theme.spacing.xs,
    fontWeight: 'bold',
    color: theme.colors.GRAY,
  },
  locationPicker: {
    height: theme.heights.control,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.BORDER,
    backgroundColor: theme.colors.SURFACE,
  },
  locationPickerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  locationTextSelected: {
    ...theme.typography.body,
    color: theme.colors.TEXT,
  },
  locationTextPlaceholder: {
    ...theme.typography.body,
    color: theme.colors.TEXT_MUTED,
  },
  saveButtonWrap: {
    marginTop: theme.spacing.xl,
  },
  verificationModalContent: {
    marginTop: theme.spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  verifyButtonWrap: {
    marginTop: theme.spacing['2xl'],
    width: '100%',
  },
}));
