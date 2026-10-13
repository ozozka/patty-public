/** Source file for AuthNavigator. */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DeletedAccountScreen } from 'src/screens/account/DeletedAccountScreen';
import { ForgotPasswordScreen } from 'src/screens/auth/ForgotPasswordScreen';
import { LoginScreen } from 'src/screens/auth/LoginScreen';
import { NewPasswordScreen } from 'src/screens/auth/NewPasswordScreen';
import { RegisterScreen } from 'src/screens/auth/RegisterScreen';
import { ResetPasswordOtpScreen } from 'src/screens/auth/ResetPasswordOtpScreen';
import type { AuthStackParamList } from 'src/types/navigation';

import { stackTransition } from './animationConfig';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Navigation for unauthenticated users.
 */
export function AuthNavigator() {
  const { t } = useTranslation();

  return (
    <AuthStack.Navigator
      screenOptions={{
        ...stackTransition,
      }}
    >
      <AuthStack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{
          headerShown: false,
          title: t('auth.login_title'),
        }}
      />
      <AuthStack.Screen
        name="RegisterScreen"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="ForgotPasswordScreen"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="ResetPasswordOtpScreen"
        component={ResetPasswordOtpScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="NewPasswordScreen"
        component={NewPasswordScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="DeletedAccountScreen"
        component={DeletedAccountScreen}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
}
