import type { PetCandidate } from '@patty/contracts';
/**
 * Component for displaying a pet's profile card in the matching stack.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { LocationBadge } from 'src/component/common/LocationBadge';
import { Tag } from 'src/component/common/Tag';
import { BLURHASH } from 'src/constants/blurhash';
import {
  ChevronDown,
  ChevronUp,
  Mars,
  MoreVertical,
  Navigation,
  Venus,
  Zap,
} from 'src/lib/icons';
import { formatAge } from 'src/utils/date';
import { optimizeCardUrl } from 'src/utils/image';
import { androidTextProps } from 'src/utils/platform';

const SEPARATOR = ', ';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * Props for DiscoveryPetCard component.
 */
export interface DiscoveryPetCardProps {
  pet: PetCandidate;
  onLongPress?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32; // md is 16px, so 16*2 = 32
const IDEAL_HEIGHT = CARD_WIDTH * (4 / 3);
const MAX_HEIGHT = SCREEN_HEIGHT * 0.75;
const CARD_HEIGHT = Math.min(IDEAL_HEIGHT, MAX_HEIGHT);

/**
 * A card component that displays a pet's images (carousel), name, age, and bio.
 */
export function DiscoveryPetCard({ pet, onLongPress }: DiscoveryPetCardProps) {
  const { theme } = useUnistyles();

  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const photoCount = pet.photos.length;

  const currentPhotoUrl = useMemo(
    () => optimizeCardUrl(pet.photos[photoIndex]) ?? null,
    [pet.photos, photoIndex],
  );

  const getEnergyLabel = (level?: number) => {
    if (!level) return '';
    if (level <= 2) return t('pet.energy_low');
    if (level <= 4) return t('pet.energy_medium');
    return t('pet.energy_high');
  };

  const handlePress = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const goToNextPhoto = useCallback(() => {
    if (photoIndex < photoCount - 1) setPhotoIndex((i) => i + 1);
  }, [photoIndex, photoCount]);

  const goToPrevPhoto = useCallback(() => {
    if (photoIndex > 0) setPhotoIndex((i) => i - 1);
  }, [photoIndex]);

  return (
    <Pressable
      testID="discovery-pet-card"
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      <View
        style={[
          styles.cardContainer,
          { width: CARD_WIDTH, height: CARD_HEIGHT },
        ]}
      >
        <View style={styles.imageContainer}>
          {currentPhotoUrl ? (
            <Image
              source={{ uri: currentPhotoUrl }}
              style={styles.fullSize}
              contentFit="cover"
              placeholder={BLURHASH}
              transition={300}
            />
          ) : (
            <View style={[styles.fullSize, styles.noImageContainer]}>
              <Text style={styles.noImageText}>{t('common.no_image')}</Text>
            </View>
          )}

          {/* Photo navigation tap zones */}
          {photoCount > 1 && (
            <>
              <Pressable
                testID="discovery-pet-card-prev-photo"
                style={[styles.photoTapZoneLeft, { height: CARD_HEIGHT * 0.7 }]}
                onPress={(e) => {
                  e.stopPropagation();
                  goToPrevPhoto();
                }}
              />
              <Pressable
                testID="discovery-pet-card-next-photo"
                style={[
                  styles.photoTapZoneRight,
                  { height: CARD_HEIGHT * 0.7 },
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  goToNextPhoto();
                }}
              />
            </>
          )}

          {/* Photo dot indicators */}
          {photoCount > 1 && (
            <View style={styles.dotIndicatorContainer}>
              {pet.photos.map((photoUrl, idx) => (
                <View
                  key={photoUrl}
                  style={[
                    styles.dotIndicator,
                    idx === photoIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Proximity Pill */}
          {pet.distance_m !== undefined && pet.distance_m !== null && (
            <View style={styles.proximityPill}>
              <View style={styles.proximityPillContent}>
                <Navigation
                  size={theme.sizes.iconSm}
                  color={theme.colors.TEXT_ON_IMAGE}
                />
                <Text style={styles.proximityPillText}>
                  {pet.distance_m < 1000
                    ? `${Math.round(pet.distance_m)}m`
                    : `${(pet.distance_m / 1000).toFixed(1)}km`}
                </Text>
              </View>
            </View>
          )}

          {/* More Actions Button */}
          <Pressable
            testID="discovery-pet-card-more-button"
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation();
              onLongPress?.();
            }}
          >
            <View style={styles.moreButtonInner}>
              <MoreVertical
                size={theme.sizes.icon}
                color={theme.colors.TEXT_ON_IMAGE}
              />
            </View>
          </Pressable>

          <AnimatedLinearGradient
            colors={theme.colors.GRADIENT_CARD_OVERLAY}
            style={[
              styles.gradient,
              isExpanded ? styles.gradientExpanded : styles.gradientCollapsed,
            ]}
            testID="pet-card-gradient"
            layout={Layout.springify()}
          />

          <Animated.View
            style={[
              styles.contentContainer,
              isExpanded ? styles.contentExpanded : styles.contentCollapsed,
            ]}
            layout={Layout.springify()}
          >
            <View style={styles.tagsRow}>
              {pet.gender && (
                <Tag
                  icon={pet.gender === 'male' ? Mars : Venus}
                  label={
                    pet.gender === 'male'
                      ? t('profile.male')
                      : t('profile.female')
                  }
                  style={
                    pet.gender === 'male'
                      ? { color: theme.colors.GENDER_MALE }
                      : { color: theme.colors.GENDER_FEMALE }
                  }
                  testID="trait-gender"
                />
              )}
              {pet.energy_level != null && (
                <Tag
                  icon={Zap}
                  label={getEnergyLabel(pet.energy_level ?? undefined)}
                  style={{ color: theme.colors.GENDER_OTHER }}
                  testID="trait-energy"
                />
              )}
            </View>

            <View style={styles.nameRow}>
              <View style={styles.nameContainer}>
                <Text
                  style={styles.nameText}
                  {...androidTextProps}
                  allowFontScaling={false}
                >
                  {pet.name}
                  {SEPARATOR}
                  {formatAge(pet.birth_date) ?? '?'}
                </Text>
                {isExpanded ? (
                  <Animated.View entering={FadeIn} exiting={FadeOut}>
                    <ChevronDown
                      size={theme.sizes.icon}
                      color={theme.colors.TEXT_ON_IMAGE}
                    />
                  </Animated.View>
                ) : (
                  <Animated.View entering={FadeIn} exiting={FadeOut}>
                    <ChevronUp
                      size={theme.sizes.icon}
                      color={theme.colors.TEXT_ON_IMAGE}
                    />
                  </Animated.View>
                )}
              </View>
            </View>

            {pet.breed_name && (
              <View style={styles.breedContainer}>
                <Text
                  style={styles.breedText}
                  {...androidTextProps}
                  allowFontScaling={false}
                >
                  {pet.breed_name}
                </Text>
              </View>
            )}

            <View style={styles.locationContainer}>
              <LocationBadge
                name={pet.location_name}
                distanceM={pet.distance_m}
                style={{ color: theme.colors.TEXT_ON_IMAGE }}
              />
            </View>

            {pet.bio && (
              <Animated.Text
                style={styles.bioText}
                numberOfLines={isExpanded ? 0 : 2}
                layout={Layout.springify()}
                {...androidTextProps}
                allowFontScaling={false}
              >
                {pet.bio}
              </Animated.Text>
            )}
          </Animated.View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  cardContainer: {
    overflow: 'hidden',
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.SURFACE,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  fullSize: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.COMPONENT,
  },
  noImageText: {
    ...theme.typography.body,
    color: theme.colors.GRAY,
  },
  photoTapZoneLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '35%',
  },
  photoTapZoneRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '35%',
  },
  dotIndicatorContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  dotIndicator: {
    borderRadius: theme.borderRadius.full,
  },
  dotActive: {
    width: theme.spacing.xl,
    height: 1.5 * theme.spacing.xs,
    backgroundColor: theme.colors.TEXT_ON_IMAGE,
  },
  dotInactive: {
    width: 1.5 * theme.spacing.xs,
    height: 1.5 * theme.spacing.xs,
    backgroundColor: theme.colors.TEXT_ON_IMAGE + '66',
  },
  proximityPill: {
    position: 'absolute',
    left: theme.spacing.sm,
    top: theme.spacing.sm,
    backgroundColor: theme.colors.OVERLAY + '99',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  proximityPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  proximityPillText: {
    ...theme.typography.caption,
    fontWeight: 'bold',
    color: theme.colors.TEXT_ON_IMAGE,
  },
  moreButton: {
    position: 'absolute',
    right: theme.spacing.md,
    top: theme.spacing.md,
    zIndex: theme.zIndex.dropdown,
  },
  moreButtonInner: {
    backgroundColor: theme.colors.OVERLAY + '66',
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.xs,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  gradientCollapsed: {
    bottom: 0,
    height: '60%',
  },
  gradientExpanded: {
    bottom: 0,
    height: '100%',
  },
  contentContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.lg,
  },
  contentCollapsed: {
    justifyContent: 'flex-end',
  },
  contentExpanded: {
    height: '100%',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  nameRow: {
    marginBottom: theme.spacing.xs,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    ...theme.typography.heading,
    color: theme.colors.TEXT_ON_IMAGE,
  },
  breedContainer: {
    marginBottom: theme.spacing.xs,
  },
  breedText: {
    ...theme.typography.sectionHeader,
    color: theme.colors.TEXT_ON_IMAGE,
  },
  locationContainer: {
    marginBottom: theme.spacing.sm,
  },
  bioText: {
    ...theme.typography.bodySmall,
    color: theme.colors.TEXT_ON_IMAGE,
  },
}));
