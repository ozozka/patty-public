/** Screen for new user registration with multi-step wizard. */
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { RegisterStepCredentials } from 'src/component/auth/RegisterStepCredentials';
import { RegisterStepLocation } from 'src/component/auth/RegisterStepLocation';
import { RegisterStepName } from 'src/component/auth/RegisterStepName';
import { RegisterStepProfile } from 'src/component/auth/RegisterStepProfile';
import { AppHeader } from 'src/component/common/AppHeader';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { StepWizard } from 'src/component/common/StepWizard';
import { useRegisterScenario } from 'src/hooks/scenario/useRegisterScenario';
import { useAuthStore } from 'src/store/useAuthStore';
import type {
  AuthStackParamList,
  MainStackParamList,
} from 'src/types/navigation';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList & MainStackParamList
>;

export function RegisterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('MainTabs');
    }
  }, [isAuthenticated, navigation]);

  const {
    control,
    handleRegister,
    isLoading,
    currentStep,
    totalSteps,
    isLastStep,
    goNext,
    goBack,
    canProceed,
    provinces,
    districts,
    selectedProvince,
    selectedDistrict,
    selectProvince,
    selectDistrict,
    handleAutoDetect,
    isDetecting,
    phoneNumber,
    setPhoneNumber,
  } = useRegisterScenario();

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <RegisterStepName control={control} />;
      case 1:
        return <RegisterStepCredentials control={control} />;
      case 2:
        return (
          <RegisterStepLocation
            provinces={provinces}
            districts={districts}
            selectedProvince={selectedProvince}
            selectedDistrict={selectedDistrict}
            onSelectProvince={selectProvince}
            onSelectDistrict={selectDistrict}
            onAutoDetect={handleAutoDetect}
            isDetecting={isDetecting}
          />
        );
      case 3:
        return (
          <RegisterStepProfile
            control={control}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
          />
        );
      default:
        return null;
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      goBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <ScreenContainer
      layoutMode="keyboard-aware"
      header={<AppHeader showBack onBack={handleBack} transparent />}
    >
      <View style={styles.container}>
        <StepWizard
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={
            isLastStep ? () => void handleRegister() : () => void goNext()
          }
          onBack={goBack}
          canProceed={canProceed}
          isLoading={isLoading}
          nextButtonText={
            isLastStep ? t('auth.register') : t('common.continue')
          }
        >
          {renderStep()}
        </StepWizard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((_theme) => ({
  container: {
    width: '100%',
    flexGrow: 1,
  },
}));
