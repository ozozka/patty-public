/** Navigation stack parameter list definitions. */
import type { Account, PetCandidate } from '@patty/contracts';

export type AuthStackParamList = {
  LoginScreen: { errorMessage?: string } | undefined;
  RegisterScreen: undefined;
  ForgotPasswordScreen: undefined;
  ResetPasswordOtpScreen: { email: string };
  NewPasswordScreen: { email: string; code: string };
  DeletedAccountScreen: { deletedAt: string };
};

export type MainStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  EmailVerification: undefined;
  RestoreAccount: { deletedAt: string };
  PasswordConfirm: undefined;
  Profile: { userId?: string };
  EditProfile: undefined;
  SettingsScreen: undefined;
  ChangePassword: undefined;
  BlockedAccountsScreen: undefined;
  ForgotPasswordScreen: undefined;
  ResetPasswordOtpScreen: { email: string };
  NewPasswordScreen: { email: string; code: string };
  LanguagePicker: undefined;
  AddPet: undefined;
  EditPet: { petId: string };
  PetProfile: { pet: PetCandidate };
  MyPetProfile: { petId: string };
  ChatDetail: { conversationId: string; otherUser?: Account };
};

export type MainTabParamList = {
  PetsScreen: undefined;
  DiscoveryScreen: undefined;
  ChatListScreen: undefined;
  Profile: undefined;
};
