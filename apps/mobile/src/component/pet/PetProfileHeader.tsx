/**
 * Shared pet profile header component with photo carousel.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, Text, View } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Tag } from 'src/component/common/Tag';
import { BLURHASH } from 'src/constants/blurhash';
import { MapPin, Mars, Venus, Zap } from 'src/lib/icons';
import { formatAge } from 'src/utils/date';
import { optimizeCardUrl } from 'src/utils/image';
import { androidTextProps } from 'src/utils/platform';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface PetProfileHeaderProps {
  name: string;
  breedName?: string | null;
  birthDate?: string | null;
  gender?: 'male' | 'female';
  energyLevel?: number;
  locationName?: string | null;
  photos: string[];
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // 2xl is 24px, 24*2 = 48
const CARD_HEIGHT = CARD_WIDTH * (4 / 3);

export function PetProfileHeader({
  name,
  breedName,
  birthDate,
  gender,
  energyLevel,
  locationName,
  photos,
}: PetProfileHeaderProps) {
  const { theme } = useUnistyles();

  const { t } = useTranslation();
  const [photoIndex, setPhotoIndex] = useState(0);

  const currentPhotoUrl = optimizeCardUrl(photos[photoIndex]) ?? null;
  const photoCount = photos.length;

  const getEnergyLabel = (level?: number) => {
    if (!level) return '';
    if (level <= 2) return t('pet.energy_low');
    if (level <= 4) return t('pet.energy_medium');
    return t('pet.energy_high');
  };

  const goToNextPhoto = () => {
    if (photoIndex < photoCount - 1) {
      setPhotoIndex((i) => i + 1);
    }
  };

  const goToPrevPhoto = () => {
    if (photoIndex > 0) {
      setPhotoIndex((i) => i - 1);
    }
  };

  return (
    <View
      style={[styles.container, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
    >
      <View style={styles.imageContainer}>
        {currentPhotoUrl ? (
          <Image
            source={{ uri: currentPhotoUrl }}
            style={styles.fullImage}
            contentFit="cover"
            placeholder={BLURHASH}
            transition={300}
          />
        ) : (
          <View style={[styles.fullImage, styles.noImageContainer]}>
            <Text style={styles.noImageText}>{t('common.no_image')}</Text>
          </View>
        )}

        {photoCount > 1 && (
          <>
            <Pressable
              testID="pet-photo-prev"
              style={[styles.tapZoneLeft, { height: CARD_HEIGHT * 0.7 }]}
              onPress={goToPrevPhoto}
            />
            <Pressable
              testID="pet-photo-next"
              style={[styles.tapZoneRight, { height: CARD_HEIGHT * 0.7 }]}
              onPress={goToNextPhoto}
            />
          </>
        )}

        {photoCount > 1 && (
          <View style={styles.dotsContainer}>
            {photos.map((photoUrl, idx) => (
              <View
                key={photoUrl}
                style={[
                  styles.dot,
                  idx === photoIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        )}

        <AnimatedLinearGradient
          colors={theme.colors.GRADIENT_CARD_OVERLAY}
          style={styles.gradient}
          layout={Layout.springify()}
        />

        <Animated.View style={styles.contentContainer}>
          <View style={styles.tagsRow}>
            {gender && (
              <Tag
                icon={gender === 'male' ? Mars : Venus}
                label={
                  gender === 'male' ? t('profile.male') : t('profile.female')
                }
                style={
                  gender === 'male'
                    ? { color: theme.colors.GENDER_MALE }
                    : { color: theme.colors.GENDER_FEMALE }
                }
              />
            )}
            {energyLevel != null && (
              <Tag
                icon={Zap}
                label={getEnergyLabel(energyLevel)}
                style={{ color: theme.colors.GENDER_OTHER }}
              />
            )}
          </View>

          <View style={styles.nameRow}>
            <Text
              style={styles.nameText}
              {...androidTextProps}
              allowFontScaling={false}
            >
              {name}
              {birthDate ? `${', '}${formatAge(birthDate) ?? ''}` : ''}
            </Text>
          </View>

          {breedName && (
            <View style={styles.breedRow}>
              <Text
                style={styles.breedText}
                {...androidTextProps}
                allowFontScaling={false}
              >
                {breedName}
              </Text>
            </View>
          )}

          {locationName && (
            <View style={styles.locationRow}>
              <MapPin
                size={theme.sizes.iconSm}
                color={theme.colors.TEXT_ON_IMAGE}
              />
              <View style={styles.locationTextWrap}>
                <Text
                  style={styles.locationText}
                  {...androidTextProps}
                  allowFontScaling={false}
                >
                  {locationName}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.xl,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  fullImage: {
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
  tapZoneLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '35%',
  },
  tapZoneRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '35%',
  },
  dotsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  dot: {
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
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  contentContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.lg,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  nameRow: {
    marginBottom: theme.spacing.xs,
  },
  nameText: {
    ...theme.typography.heading,
    color: theme.colors.TEXT_ON_IMAGE,
  },
  breedRow: {
    marginBottom: theme.spacing.xs,
  },
  breedText: {
    ...theme.typography.sectionHeader,
    color: theme.colors.TEXT_ON_IMAGE,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextWrap: {
    marginLeft: theme.spacing.xs,
  },
  locationText: {
    ...theme.typography.caption,
    color: theme.colors.TEXT_ON_IMAGE,
  },
}));
