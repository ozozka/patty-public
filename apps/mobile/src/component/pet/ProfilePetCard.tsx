import type { Pet } from '@patty/contracts';
import { addDays, differenceInDays } from 'date-fns';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Card } from 'src/component/common/Card';
import { BLURHASH } from 'src/constants/blurhash';
import { Images, RefreshCw } from 'src/lib/icons';
import { formatAge } from 'src/utils/date';
import { optimizeCardUrl } from 'src/utils/image';

const PET_CARD_IMAGE_HEIGHT = 180;

export interface ProfilePetCardProps {
  pet: Pet;
  breedName?: string;
  onPress?: (pet: Pet) => void;
  isDeleted?: boolean;
}

export function ProfilePetCard({
  pet,
  breedName,
  onPress,
  isDeleted,
}: ProfilePetCardProps) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  const age = useMemo(() => formatAge(pet.birth_date), [pet.birth_date]);
  const primaryImageUrl = useMemo(
    () => optimizeCardUrl((pet.photos ?? [])[0]?.image_url ?? null),
    [pet.photos],
  );
  const photoCount = (pet.photos ?? []).length;

  const daysRemaining = useMemo(() => {
    if (!pet.deleted_at) return 0;
    const restoreUntil = addDays(new Date(pet.deleted_at), 30);
    return Math.max(0, differenceInDays(restoreUntil, new Date()));
  }, [pet.deleted_at]);

  const Content = (
    <View style={styles.wrapper}>
      <Card
        variant="elevated"
        padding={0}
        style={[styles.container, isDeleted && styles.deletedContainer]}
      >
        <View style={styles.imageContainer}>
          {primaryImageUrl ? (
            <Image
              source={{ uri: primaryImageUrl }}
              style={styles.fullImage}
              contentFit="cover"
              placeholder={BLURHASH}
              transition={200}
            />
          ) : (
            <View style={styles.noImage} />
          )}

          {isDeleted && (
            <View style={styles.deletedOverlay}>
              <View style={styles.restoreBadge}>
                <RefreshCw
                  size={theme.sizes.iconSm}
                  color={theme.colors.TEXT_ON_IMAGE}
                />
                <Text style={styles.restoreText}>
                  {t('settings.restore_account')}
                </Text>
              </View>
              <Text style={styles.daysRemainingText}>
                {t('settings.days_remaining', { count: daysRemaining })}
              </Text>
            </View>
          )}

          {/* Photo count badge */}
          {!isDeleted && photoCount > 1 && (
            <View style={styles.photoCountBadge}>
              <Images
                size={theme.sizes.iconSm}
                color={theme.colors.TEXT_ON_IMAGE}
              />
              <Text style={styles.photoCountText}>{photoCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, isDeleted && styles.nameDeleted]}
              numberOfLines={1}
            >
              {pet.name}
            </Text>
            {age && !isDeleted && (
              <View style={styles.ageWrap}>
                <Text style={styles.ageText}>{age}</Text>
              </View>
            )}
          </View>
          {breedName && (
            <Text
              style={[styles.breed, isDeleted && styles.breedDeleted]}
              numberOfLines={1}
            >
              {breedName}
            </Text>
          )}
        </View>
      </Card>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(pet)}
        testID={`pet-card-${pet.id}`}
      >
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
}

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    marginBottom: theme.spacing.md,
  },
  container: {
    overflow: 'hidden',
  },
  deletedContainer: {
    opacity: 0.8,
  },
  deletedImage: {
    opacity: 0.6,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: PET_CARD_IMAGE_HEIGHT,
  },
  fullImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  noImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.COMPONENT,
  },
  deletedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.OVERLAY,
  },
  restoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.PRIMARY,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  restoreText: {
    ...theme.typography.caption,
    color: theme.colors.TEXT_ON_IMAGE,
  },
  daysRemainingText: {
    ...theme.typography.caption,
    color: theme.colors.TEXT_ON_IMAGE,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  photoCountText: {
    ...theme.typography.caption,
    fontWeight: 'bold',
    color: theme.colors.TEXT_ON_IMAGE,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  name: {
    ...theme.typography.button,
    flex: 1,
  },
  nameDeleted: {
    color: theme.colors.TEXT_MUTED,
  },
  ageWrap: {
    marginLeft: theme.spacing.sm,
  },
  ageText: {
    ...theme.typography.caption,
    color: theme.colors.TEXT_MUTED,
  },
  breed: {
    ...theme.typography.bodySmall,
  },
  breedDeleted: {
    color: theme.colors.TEXT_MUTED,
  },
}));
