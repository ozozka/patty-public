import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { CheckCircle2, Info, Lightbulb, User } from 'src/lib/icons';

/**
 * Tips for uploading a good pet profile photo.
 */
export function PhotoTips() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const tips = [
    {
      id: 'lighting',
      icon: Lightbulb,
      text: t('pet.guidelines_lighting'),
      iconColor: theme.colors.SECONDARY,
      bgColor: theme.colors.SECONDARY + '20',
    },
    {
      id: 'face',
      icon: User,
      text: t('pet.guidelines_face'),
      iconColor: theme.colors.PRIMARY,
      bgColor: theme.colors.PRIMARY + '20',
    },
    {
      id: 'clear',
      icon: CheckCircle2,
      text: t('pet.guidelines_clear'),
      iconColor: theme.colors.SUCCESS,
      bgColor: theme.colors.SUCCESS + '20',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Info size={theme.sizes.icon} color={theme.colors.TEXT_SECONDARY} />
        <Text style={styles.title}>{t('pet.photo_tips')}</Text>
      </View>

      <View style={styles.tipsContainer}>
        {tips.map((tip) => (
          <View key={tip.id} style={styles.tipRow}>
            <View
              style={[styles.iconContainer, { backgroundColor: tip.bgColor }]}
            >
              <tip.icon size={14} color={tip.iconColor} />
            </View>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.SURFACE_SUNKEN,
    padding: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.sectionHeader,
    color: theme.colors.TEXT,
  },
  tipsContainer: {
    width: '100%',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  iconContainer: {
    marginTop: theme.spacing.xs,
    width: theme.sizes.icon,
    height: theme.sizes.icon,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },
  tipText: {
    ...theme.typography.bodySmall,
    flex: 1,
    color: theme.colors.TEXT_SECONDARY,
  },
}));
