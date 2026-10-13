import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { AppHeader } from 'src/component/common/AppHeader';
import { ScreenContainer } from 'src/component/common/ScreenContainer';
import { OverflowMenu } from 'src/component/profile/OverflowMenu';
import { ProfileContent } from 'src/component/profile/ProfileContent';
import { useProfile, usePublicProfile } from 'src/hooks/api/useUserApi';
import { MoreVertical } from 'src/lib/icons';
import { QueryKeys } from 'src/lib/queryKeys';
import type { MainStackParamList } from 'src/types/navigation';

type RoutePropType = RouteProp<MainStackParamList, 'Profile'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'Profile'>;

export function ProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const queryClient = useQueryClient();
  const { theme } = useUnistyles();

  const userId = route.params?.userId;

  const {
    data: ownProfile,
    isLoading: isOwnLoading,
    isFetching: isOwnFetching,
  } = useProfile();

  const currentUserId = ownProfile?.id;
  const isOwnProfile = !userId || userId === currentUserId;

  const {
    data: userProfile,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
  } = usePublicProfile(userId ?? null);

  const profile = isOwnProfile ? ownProfile : userProfile;
  const isLoading = isOwnProfile ? isOwnLoading : isUserLoading;
  const isFetching = isOwnProfile ? isOwnFetching : isUserFetching;
  const isRefreshing = isFetching && !!profile;

  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [overflowMenuPosition, setOverflowMenuPosition] = useState({
    x: 0,
    y: 0,
  });

  const handleRefresh = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isOwnProfile) {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: QueryKeys.profile() }),
        queryClient.invalidateQueries({ queryKey: QueryKeys.conversations() }),
      ]);
    } else {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: QueryKeys.publicProfile(userId),
        }),
        queryClient.invalidateQueries({ queryKey: QueryKeys.locations() }),
      ]);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleMessage = () => {
    if (profile && !isOwnProfile) {
      navigation.navigate('ChatDetail', { conversationId: profile.id });
    }
  };

  const handleSettingsPress = () => {
    navigation.navigate('SettingsScreen');
  };

  const handleOverflowPress = (event: {
    nativeEvent: { pageX: number; pageY: number };
  }) => {
    const { pageX, pageY } = event.nativeEvent;
    setOverflowMenuPosition({ x: pageX, y: pageY });
    setShowOverflowMenu(true);
  };

  return (
    <ScreenContainer
      testID="screen.profile"
      header={
        <AppHeader
          title={
            isOwnProfile
              ? t('navigation.profile')
              : (`${profile?.first_name} ${profile?.last_name}`.trim() ??
                t('navigation.profile'))
          }
          rightElement={
            <TouchableOpacity
              onPress={isOwnProfile ? handleSettingsPress : handleOverflowPress}
              activeOpacity={0.7}
              testID={
                isOwnProfile
                  ? 'profile-settings-button'
                  : 'profile-overflow-button'
              }
            >
              <View style={styles.iconWrap}>
                <MoreVertical
                  color={theme.colors.TEXT}
                  size={theme.sizes.icon}
                />
              </View>
            </TouchableOpacity>
          }
          showBack={!isOwnProfile}
        />
      }
    >
      <View style={styles.container}>
        <ProfileContent
          profile={profile}
          isOwnProfile={isOwnProfile}
          onEditProfile={handleEditProfile}
          onMessage={handleMessage}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      </View>

      {!isOwnProfile && profile && showOverflowMenu && (
        <OverflowMenu
          userId={profile.id}
          userName={profile.username}
          onClose={() => setShowOverflowMenu(false)}
          position={overflowMenuPosition}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    paddingVertical: theme.spacing.md,
  },
  iconWrap: {
    padding: theme.spacing.xs,
  },
}));
