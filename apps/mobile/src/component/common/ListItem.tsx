/**
 * A reusable ListItem component for lists.
 */
import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import {
  Animated as RNAnimated,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { BadgeCheck, ChevronRight, Trash2 } from 'src/lib/icons';
import { androidTextProps } from 'src/utils/platform';

import { AvatarImage } from './AvatarImage';
import { Divider } from './Divider';

const BADGE_MIN_WIDTH = 20;
const DELETE_ACTION_WIDTH = 80;

export interface ListItemProps {
  title: string;
  subtitle?: string;
  rightSubtitle?: string;
  avatar?: string;
  icon?: React.ElementType;
  iconColor?: string;
  iconBackgroundColor?: string;
  leftElement?: React.ReactNode;
  onPress?: () => void;
  onDelete?: () => void;
  rightElement?: React.ReactNode;
  verified?: boolean;
  isOnline?: boolean;
  badge?: number;
  showDivider?: boolean;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  testID?: string;
  /** @deprecated Use iconColor instead */
  iconClassName?: string;
  /** @deprecated Use titleStyle instead */
  titleClassName?: string;
}

export function ListItem({
  title,
  subtitle,
  rightSubtitle,
  avatar,
  icon: Icon,
  iconColor,
  iconBackgroundColor,
  leftElement,
  onPress,
  rightElement,
  verified,
  isOnline,
  badge,
  showDivider = true,
  style,
  titleStyle,
  onDelete,
  testID,
  iconClassName: _iconClassName,
}: ListItemProps) {
  const { theme } = useUnistyles();

  const renderLeft = () => {
    if (leftElement) return leftElement;
    if (avatar) {
      return (
        <View style={styles.avatarWrap}>
          <AvatarImage uri={avatar} size={50} isOnline={isOnline} />
        </View>
      );
    }
    if (Icon) {
      const defaultIconColor = iconBackgroundColor
        ? theme.colors.ON_PRIMARY
        : theme.colors.PRIMARY;
      return (
        <View
          style={[
            styles.iconContainer,
            iconBackgroundColor
              ? { backgroundColor: iconBackgroundColor }
              : null,
          ]}
        >
          <Icon size={22} color={iconColor ?? defaultIconColor} />
        </View>
      );
    }
    return null;
  };

  const renderRightActions = (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>,
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
    });
    return (
      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteAction}
        testID="swipe-delete-button"
      >
        <RNAnimated.View style={{ transform: [{ translateX: trans }] }}>
          <Trash2 size={theme.sizes.icon} color={theme.colors.ON_PRIMARY} />
        </RNAnimated.View>
      </TouchableOpacity>
    );
  };

  const Content = (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.leftSection}>
        {renderLeft()}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, titleStyle]}
              numberOfLines={1}
              {...androidTextProps}
              allowFontScaling={false}
            >
              {title}
            </Text>
            {verified && (
              <View style={styles.verifiedBadge}>
                <BadgeCheck
                  size={theme.sizes.iconSm}
                  color={theme.colors.PRIMARY}
                  testID="icon-badge-check"
                />
              </View>
            )}
          </View>
          {subtitle && (
            <Text
              style={styles.subtitle}
              numberOfLines={1}
              {...androidTextProps}
              allowFontScaling={false}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.rightSection}>
        {rightSubtitle && (
          <Text style={styles.rightSubtitle}>{rightSubtitle}</Text>
        )}
        <View style={styles.rightContent}>
          {badge !== undefined && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          )}
          {rightElement ??
            (onPress && (
              <ChevronRight size={theme.sizes.icon} color={theme.colors.GRAY} />
            ))}
        </View>
      </View>
    </View>
  );

  const mainItem = onPress ? (
    <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.7}>
      {Content}
    </TouchableOpacity>
  ) : (
    Content
  );

  return (
    <>
      {onDelete ? (
        <Swipeable
          renderRightActions={renderRightActions}
          friction={2}
          rightThreshold={40}
        >
          {mainItem}
        </Swipeable>
      ) : (
        mainItem
      )}
      {showDivider && <Divider style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  avatarWrap: {
    marginRight: theme.spacing.md,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
    width: theme.sizes.iconSm + 8,
    height: theme.sizes.iconSm + 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.button,
  },
  verifiedBadge: {
    marginLeft: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.TEXT_SECONDARY,
  },
  rightSection: {
    marginLeft: theme.spacing.sm,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightSubtitle: {
    ...theme.typography.caption,
    marginBottom: theme.spacing.xs,
    color: theme.colors.TEXT_MUTED,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    marginRight: theme.spacing.sm,
    minWidth: BADGE_MIN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.PRIMARY,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  badgeText: {
    ...theme.typography.caption,
    fontWeight: 'bold',
    color: theme.colors.ON_PRIMARY,
  },
  deleteAction: {
    width: DELETE_ACTION_WIDTH,
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: theme.colors.ERROR,
    paddingRight: theme.spacing.xl,
  },
  divider: {
    marginHorizontal: theme.spacing.xl,
    width: 'auto',
  },
}));
