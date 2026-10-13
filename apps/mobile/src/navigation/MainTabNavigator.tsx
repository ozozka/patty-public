/** Source file for MainTabNavigator. */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'src/hooks/ui/useTheme';
import { Flame, Heart, MessageCircle, User } from 'src/lib/icons';
import { ChatListScreen } from 'src/screens/chat/ChatListScreen';
import { DiscoveryScreen } from 'src/screens/matching/DiscoveryScreen';
import { PetsScreen } from 'src/screens/profile/PetsScreen';
import { ProfileScreen } from 'src/screens/profile/ProfileScreen';
import { useChatStore } from 'src/store/useChatStore';

const AppTab = createBottomTabNavigator();

/**
 * Main bottom tab navigation.
 */
export function MainTabNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <AppTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.TRANSPARENT_TAB_BAR,
          borderTopColor: colors.BORDER_LIGHT,
          borderTopWidth: 0.5,
        },
        tabBarActiveTintColor: colors.PRIMARY,
        tabBarInactiveTintColor: colors.TEXT_MUTED,
      }}
    >
      <AppTab.Screen
        name="DiscoveryScreen"
        component={DiscoveryScreen}
        options={{
          tabBarLabel: t('navigation.discovery'),
          tabBarButtonTestID: 'tab-bar-item-Discovery',
          tabBarIcon: ({ focused, size }) => (
            <Flame
              color={focused ? colors.PRIMARY : colors.TEXT_MUTED}
              size={size}
            />
          ),
        }}
      />
      <AppTab.Screen
        name="PetsScreen"
        component={PetsScreen}
        options={{
          tabBarLabel: t('navigation.pets'),
          tabBarButtonTestID: 'tab-bar-item-Pets',
          tabBarIcon: ({ focused, size }) => (
            <Heart
              color={focused ? colors.PRIMARY : colors.TEXT_MUTED}
              size={size}
            />
          ),
        }}
      />
      <AppTab.Screen
        name="ChatListScreen"
        component={ChatListScreen}
        options={{
          tabBarLabel: t('navigation.chat'),
          tabBarButtonTestID: 'tab-bar-item-Chat',
          tabBarIcon: ({ focused, size }) => (
            <MessageCircle
              color={focused ? colors.PRIMARY : colors.TEXT_MUTED}
              size={size}
            />
          ),
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
        }}
      />
      <AppTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('navigation.profile'),
          tabBarButtonTestID: 'tab-bar-item-Profile',
          tabBarIcon: ({ focused, size }) => (
            <User
              color={focused ? colors.PRIMARY : colors.TEXT_MUTED}
              size={size}
            />
          ),
        }}
      />
    </AppTab.Navigator>
  );
}
