/** Source file for AppNavigator. */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useProfile } from 'src/hooks/api/useUserApi';
import { useChatConnection } from 'src/hooks/useChatConnection';
import { DeletedAccountScreen } from 'src/screens/account/DeletedAccountScreen';
import { EmailVerificationScreen } from 'src/screens/auth/EmailVerificationScreen';
import { ForgotPasswordScreen } from 'src/screens/auth/ForgotPasswordScreen';
import { NewPasswordScreen } from 'src/screens/auth/NewPasswordScreen';
import { ResetPasswordOtpScreen } from 'src/screens/auth/ResetPasswordOtpScreen';
import { ChatDetailScreen } from 'src/screens/chat/ChatDetailScreen';
import { AddPetScreen } from 'src/screens/profile/AddPetScreen';
import { BlockedAccountsScreen } from 'src/screens/profile/BlockedAccountsScreen';
import { ChangePasswordScreen } from 'src/screens/profile/ChangePasswordScreen';
import { EditPetScreen } from 'src/screens/profile/EditPetScreen';
import { EditProfileScreen } from 'src/screens/profile/EditProfileScreen';
import { LanguagePicker } from 'src/screens/profile/LanguagePicker';
import { MyPetProfileScreen } from 'src/screens/profile/MyPetProfileScreen';
import { PetProfileScreen } from 'src/screens/profile/PetProfileScreen';
import { ProfileScreen } from 'src/screens/profile/ProfileScreen';
import { SettingsScreen } from 'src/screens/profile/SettingsScreen';
import { PasswordConfirmScreen } from 'src/screens/settings/PasswordConfirmScreen';
import { useAuthStore } from 'src/store/useAuthStore';
import type { MainStackParamList } from 'src/types/navigation';

import { stackTransition } from './animationConfig';
import { MainTabNavigator } from './MainTabNavigator';

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const AppStack = createNativeStackNavigator<MainStackParamList>();

/**
 * Stack navigation for authenticated users.
 */
export function AppNavigator() {
  const token = useAuthStore((state) => state.token);
  useChatConnection();
  const { data: user, isLoading } = useProfile();
  const { theme } = useUnistyles();

  const accountStatus = user?.status;
  const deletedAt = user?.deleted_at;

  if (token && isLoading && !user) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.BACKGROUND },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (deletedAt) {
    return (
      <AppStack.Navigator
        screenOptions={{
          headerShown: false,
          ...stackTransition,
        }}
      >
        <AppStack.Screen
          name="RestoreAccount"
          component={DeletedAccountScreen}
          initialParams={{ deletedAt }}
        />
      </AppStack.Navigator>
    );
  }

  if (accountStatus === 'unverified') {
    return (
      <AppStack.Navigator>
        <AppStack.Screen
          name="EmailVerification"
          component={EmailVerificationScreen}
          options={{ headerShown: false }}
        />
      </AppStack.Navigator>
    );
  }

  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
        ...stackTransition,
      }}
    >
      <AppStack.Screen name="MainTabs" component={MainTabNavigator} />
      <AppStack.Screen name="Profile" component={ProfileScreen} />
      <AppStack.Screen name="SettingsScreen" component={SettingsScreen} />
      <AppStack.Screen name="EditProfile" component={EditProfileScreen} />
      <AppStack.Screen
        name="BlockedAccountsScreen"
        component={BlockedAccountsScreen}
      />
      <AppStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <AppStack.Screen
        name="ForgotPasswordScreen"
        component={ForgotPasswordScreen}
      />
      <AppStack.Screen
        name="ResetPasswordOtpScreen"
        component={ResetPasswordOtpScreen}
      />
      <AppStack.Screen name="NewPasswordScreen" component={NewPasswordScreen} />
      <AppStack.Screen
        name="PasswordConfirm"
        component={PasswordConfirmScreen}
      />
      <AppStack.Screen name="LanguagePicker" component={LanguagePicker} />
      <AppStack.Screen name="AddPet" component={AddPetScreen} />
      <AppStack.Screen name="EditPet" component={EditPetScreen} />
      <AppStack.Screen name="PetProfile" component={PetProfileScreen} />
      <AppStack.Screen name="MyPetProfile" component={MyPetProfileScreen} />
      <AppStack.Screen name="ChatDetail" component={ChatDetailScreen} />
    </AppStack.Navigator>
  );
}
