import type {
  Location,
  Pet,
  PetCandidate,
  ProfileResponse,
  PublicProfileResponse,
} from '@patty/contracts';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';
import { AvatarImage } from 'src/component/common/AvatarImage';
import { Card } from 'src/component/common/Card';
import { ImageModal } from 'src/component/common/ImageModal';
import { PhotoSelectionSheet } from 'src/component/common/PhotoSelectionSheet';
import { ProfileSkeleton } from 'src/component/common/Skeleton';
import { ProfileCompletionModal } from 'src/component/profile/ProfileCompletionModal';
import { useLocations } from 'src/hooks/api/useLocationApi';
import { useConversations } from 'src/hooks/api/useMessageApi';
import {
  type ProfileCompletionAction,
  useProfileCompletion,
} from 'src/hooks/scenario/useProfileCompletion';
import { useUpdateProfilePhotoScenario } from 'src/hooks/scenario/useUpdateProfilePhotoScenario';
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Phone,
  Target,
  Trophy,
} from 'src/lib/icons';
import type { MainStackParamList } from 'src/types/navigation';
import { androidTextProps } from 'src/utils/platform';

const AT_SYMBOL = '@';
const PET_NAME_MAX_WIDTH = 70;

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export interface ProfileContentProps {
  profile: ProfileResponse | PublicProfileResponse | null | undefined;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
  onMessage?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function ProfileContent({
  profile,
  isOwnProfile,
  onEditProfile,
  onMessage,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
}: ProfileContentProps) {
  const navigation = useNavigation<NavigationProp>();
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const { data: locations } = useLocations();
  const { data: matches } = useConversations();
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  const { onTakePhoto, onChooseFromLibrary, isPending } =
    useUpdateProfilePhotoScenario(profile?.id);

  const { percentage: completionPercentage, steps: completionSteps } =
    useProfileCompletion(profile);

  const [showSuccessCard, setShowSuccessCard] = useState(false);

  // Show success card once when 100% is reached
  useEffect(() => {
    if (completionPercentage === 100 && isOwnProfile) {
      setShowSuccessCard(true);
    }
  }, [completionPercentage, isOwnProfile]);

  const handleCompletionAction = useCallback(
    (action: ProfileCompletionAction) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      switch (action) {
        case 'photo':
          setPhotoSheetVisible(true);
          break;
        case 'pet':
          navigation.navigate('AddPet');
          break;
        case 'edit_profile':
          onEditProfile?.();
          break;
        case 'phone':
          onEditProfile?.();
          break;
      }
    },
    [navigation, onEditProfile],
  );

  const handlePetPress = (pet: Pet) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isOwnProfile) {
      navigation.navigate('MyPetProfile', { petId: pet.id });
    } else {
      const petAsCandidate: PetCandidate = {
        id: pet.id,
        account_id: profile?.id ?? '',
        name: pet.name,
        breed_id: pet.breed_id,
        breed_name: undefined,
        gender: pet.gender ?? 'male',
        birth_date: pet.birth_date,
        bio: pet.bio,
        created_at: pet.created_at,
        photos: pet.photos?.map((p) => p.image_url) ?? [],
        energy_level: pet.energy_level,
        distance_m: undefined,
        location_name: undefined,
      };
      navigation.navigate('PetProfile', { pet: petAsCandidate });
    }
  };

  const locationName = useMemo(() => {
    if (profile?.home_location_id && locations) {
      const location = locations.find(
        (l: Location) => l.id === profile.home_location_id,
      );
      return location?.name_tr ?? null;
    }
    return null;
  }, [profile, locations]);

  const daysOnPati = useMemo(() => {
    if (!profile?.created_at) return 0;
    const created = new Date(profile.created_at);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) || 1;
  }, [profile]);

  const handleAvatarPress = () => {
    if (isOwnProfile) {
      setPhotoSheetVisible(true);
    } else if (profile?.profile_picture_url) {
      setImageModalVisible(true);
    }
  };

  if (isLoading && !profile) {
    return <ProfileSkeleton />;
  }

  // Layout Gate: Prevent rendering if critical data is missing
  if (!profile?.username) {
    return <ProfileSkeleton />;
  }

  const renderPetItem = ({ item }: { item: Pet }) => (
    <TouchableOpacity
      testID={`profile-pet-item-${item.id}`}
      onPress={() => handlePetPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.petItem}>
        <AvatarImage
          uri={item.photos?.[0]?.image_url}
          size={60}
          showRing
          ringColor={theme.colors.PRIMARY}
        />
        <View style={styles.petNameWrap}>
          <Text
            style={styles.petName}
            numberOfLines={1}
            {...androidTextProps}
            allowFontScaling={false}
          >
            {item.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.flex1}
      contentContainerStyle={
        isOwnProfile ? styles.contentContainerOwn : styles.contentContainer
      }
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.PRIMARY}
            colors={[theme.colors.PRIMARY]}
          />
        ) : undefined
      }
    >
      {/* 1. Profile Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity
          testID="profile-content-avatar"
          style={styles.avatarTouch}
          onPress={handleAvatarPress}
          activeOpacity={0.8}
          disabled={!isOwnProfile && !profile?.profile_picture_url}
        >
          <View>
            <AvatarImage
              uri={profile?.profile_picture_url}
              size={100}
              showRing={true}
              ringColor={theme.colors.PRIMARY}
              showBadge={isOwnProfile}
            />
            {isPending && (
              <View style={styles.pendingOverlay}>
                <ActivityIndicator color={theme.colors.SURFACE} />
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text
              style={styles.nameText}
              {...androidTextProps}
              allowFontScaling={false}
            >
              {profile?.first_name} {profile?.last_name}
            </Text>
            {profile &&
              'phone_verified' in profile &&
              profile.phone_verified && (
                <View style={styles.badgeWrap}>
                  <BadgeCheck
                    size={theme.sizes.icon}
                    color={theme.colors.PRIMARY}
                  />
                </View>
              )}
          </View>
          <Text
            style={styles.usernameText}
            {...androidTextProps}
            allowFontScaling={false}
          >
            {AT_SYMBOL}
            {profile?.username}
          </Text>
        </View>
      </View>

      {/* 1.5 Edit Profile Button (Instagram style) */}
      {isOwnProfile && onEditProfile && (
        <View style={styles.editButtonWrap}>
          <TouchableOpacity
            testID="profile-content-edit-button"
            onPress={onEditProfile}
            activeOpacity={0.7}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>
              {t('profile.edit_profile')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Completion Tracker (own profile only) */}
      {isOwnProfile && completionPercentage < 100 && (
        <TouchableOpacity
          testID="profile-content-completion-tracker"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCompletionModalVisible(true);
          }}
          activeOpacity={0.7}
          style={styles.completionTrackerWrap}
        >
          <Card variant="flat" padding="md">
            <View style={styles.completionHeader}>
              <Target size={theme.sizes.icon} color={theme.colors.PRIMARY} />
              <View style={styles.completionTitleWrap}>
                <Text style={styles.completionTitle}>
                  {t('profile.complete', { percentage: completionPercentage })}
                </Text>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${completionPercentage}%` },
                ]}
              />
            </View>
            <View style={styles.completionDescWrap}>
              <Text style={styles.completionDesc}>
                {t('profile.complete_profile_desc')}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>
      )}

      {isOwnProfile && completionPercentage === 100 && showSuccessCard && (
        <View style={styles.successCardWrap}>
          <Card variant="flat" padding="md">
            <View style={styles.successCardRow}>
              <View style={styles.successIconWrap}>
                <Trophy size={theme.sizes.icon} color={theme.colors.SUCCESS} />
              </View>
              <View style={styles.successContent}>
                <View style={styles.successTitleRow}>
                  <Text style={styles.successTitle}>
                    {t('profile.completion_success_title')}
                  </Text>
                  <TouchableOpacity
                    testID="profile-content-success-card-dismiss"
                    onPress={() => setShowSuccessCard(false)}
                  >
                    <CheckCircle2
                      size={theme.sizes.iconSm}
                      color={theme.colors.SUCCESS}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.successDesc}>
                  {t('profile.completion_success_desc')}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* 3. Stats Row */}
      <View style={styles.statsRow}>
        {isOwnProfile && (
          <>
            <View style={styles.statItem}>
              <Trophy size={theme.sizes.icon} color={theme.colors.SECONDARY} />
              <View style={styles.statValueWrap}>
                <Text style={styles.statValue}>{matches?.length ?? 0}</Text>
              </View>
              <Text style={styles.statLabel}>{t('profile.matches')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Target size={theme.sizes.icon} color={theme.colors.PRIMARY} />
              <View style={styles.statValueWrap}>
                <Text style={styles.statValue}>
                  {profile?.pets?.length ?? 0}
                </Text>
              </View>
              <Text style={styles.statLabel}>{t('profile.pets')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Calendar size={theme.sizes.icon} color={theme.colors.SUCCESS} />
              <View style={styles.statValueWrap}>
                <Text style={styles.statValue}>{daysOnPati}</Text>
              </View>
              <Text style={styles.statLabel}>{t('profile.days')}</Text>
            </View>
          </>
        )}
      </View>

      {/* 4. Phone Call Button (other profile only) */}
      {!isOwnProfile && profile?.phone_number && (
        <View style={styles.phoneButtonWrap}>
          <TouchableOpacity
            testID="profile-content-phone-call-button"
            onPress={() => void Linking.openURL(`tel:${profile.phone_number}`)}
          >
            <View style={styles.phoneButton}>
              <Phone size={theme.sizes.icon} color={theme.colors.ON_PRIMARY} />
              <Text style={styles.phoneButtonText}>
                {t('profile.phone_label', { number: profile.phone_number })}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* 5. Basic Info Card */}
      <View style={styles.basicInfoWrap}>
        <Card variant="flat">
          {isOwnProfile && profile && 'email' in profile && (
            <View style={styles.infoItem}>
              <View style={styles.infoLabelWrap}>
                <Text style={styles.infoLabel}>{t('auth.email')}</Text>
              </View>
              <Text style={styles.infoValue}>{profile.email}</Text>
            </View>
          )}

          {profile?.phone_number && (
            <View style={styles.infoItem}>
              <View style={styles.infoLabelWrap}>
                <Text style={styles.infoLabel}>{t('profile.phone')}</Text>
              </View>
              <Text style={styles.infoValue}>{profile.phone_number}</Text>
            </View>
          )}

          <View style={styles.infoItem}>
            <View style={styles.infoLabelWrap}>
              <Text style={styles.infoLabel}>{t('profile.location')}</Text>
            </View>
            <Text style={styles.infoValue}>
              {locationName ?? t('common.unknown_location')}
            </Text>
          </View>

          {profile?.bio && (
            <View>
              <View style={styles.infoLabelWrap}>
                <Text style={styles.infoLabel}>{t('profile.bio')}</Text>
              </View>
              <Text style={styles.infoValue}>{profile.bio}</Text>
            </View>
          )}
        </Card>
      </View>

      {/* 6. Your Pets Carousel */}
      {profile?.pets && profile.pets.length > 0 && (
        <View style={styles.petsCarouselWrap}>
          <View style={styles.petsCarouselTitle}>
            <Text style={styles.petsCarouselLabel}>
              {t('profile.your_pets')}
            </Text>
          </View>
          <FlatList
            horizontal
            data={profile.pets}
            renderItem={renderPetItem}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petsListContent}
          />
        </View>
      )}

      {/* 7. Message Button (other profiles only) */}
      {!isOwnProfile && onMessage && (
        <View style={styles.messageButtonWrap}>
          <ActionButton
            testID="profile-content-message-button"
            title={t('chat.message')}
            onPress={onMessage}
          />
        </View>
      )}

      <ImageModal
        visible={imageModalVisible}
        imageUrl={profile?.profile_picture_url ?? null}
        onClose={() => setImageModalVisible(false)}
      />

      {isOwnProfile && (
        <PhotoSelectionSheet
          isVisible={photoSheetVisible}
          onClose={() => setPhotoSheetVisible(false)}
          onTakePhoto={() => void onTakePhoto()}
          onChooseFromLibrary={() => void onChooseFromLibrary()}
          onViewPhoto={
            profile?.profile_picture_url
              ? () => setImageModalVisible(true)
              : undefined
          }
          title={t('profile.change_photo')}
        />
      )}

      {isOwnProfile && (
        <ProfileCompletionModal
          isVisible={completionModalVisible}
          onClose={() => setCompletionModalVisible(false)}
          steps={completionSteps}
          onAction={handleCompletionAction}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex1: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: theme.spacing['4xl'],
    paddingHorizontal: theme.spacing.md,
  },
  contentContainerOwn: {
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  avatarTouch: {
    ...theme.getShadow(1),
  },
  profileInfo: {
    flex: 1,
    marginLeft: theme.spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  nameText: {
    ...theme.typography.sectionHeader,
    color: theme.colors.TEXT,
  },
  badgeWrap: {
    marginLeft: theme.spacing.xs,
  },
  usernameText: {
    ...theme.typography.body,
    color: theme.colors.TEXT_MUTED,
  },
  editButtonWrap: {
    marginBottom: theme.spacing.xl,
  },
  editButton: {
    height: theme.heights.buttonSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.BORDER,
    backgroundColor: theme.colors.SURFACE,
  },
  editButtonText: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: theme.colors.TEXT,
  },
  completionTrackerWrap: {
    marginBottom: theme.spacing.xl,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  completionTitleWrap: {
    marginLeft: theme.spacing.sm,
  },
  completionTitle: {
    ...theme.typography.button,
    color: theme.colors.TEXT,
  },
  progressBarBg: {
    height: theme.borderWidth.lg,
    width: '100%',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.xs,
    backgroundColor: theme.colors.SURFACE_SUNKEN,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.xs,
    backgroundColor: theme.colors.PRIMARY,
  },
  completionDescWrap: {
    marginTop: theme.spacing.xs,
  },
  completionDesc: {
    ...theme.typography.caption,
    color: theme.colors.TEXT_MUTED,
  },
  successCardWrap: {
    marginBottom: theme.spacing.xl,
  },
  successCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successIconWrap: {
    marginRight: theme.spacing.md,
    width: theme.sizes.iconSm,
    height: theme.sizes.iconSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.SUCCESS + '1A',
  },
  successContent: {
    flex: 1,
  },
  successTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successTitle: {
    ...theme.typography.button,
    color: theme.colors.SUCCESS,
  },
  successDesc: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
    color: theme.colors.TEXT_MUTED,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValueWrap: {
    marginVertical: theme.spacing.xs,
  },
  statValue: {
    ...theme.typography.heading,
    color: theme.colors.TEXT,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.TEXT_MUTED,
  },
  statDivider: {
    width: theme.borderWidth.sm,
    height: theme.heights.row,
    backgroundColor: theme.colors.BORDER,
    opacity: 0.5,
  },
  phoneButtonWrap: {
    marginBottom: theme.spacing.xl,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.PRIMARY,
    padding: theme.spacing.md,
  },
  phoneButtonText: {
    ...theme.typography.button,
    fontWeight: 'bold',
    color: theme.colors.ON_PRIMARY,
  },
  basicInfoWrap: {
    marginBottom: theme.spacing.xl,
  },
  infoItem: {
    marginBottom: theme.spacing.lg,
  },
  infoLabelWrap: {
    marginBottom: theme.spacing.xs,
  },
  infoLabel: {
    ...theme.typography.label,
    color: theme.colors.TEXT_MUTED,
  },
  infoValue: {
    ...theme.typography.body,
    color: theme.colors.TEXT,
  },
  petsCarouselWrap: {
    marginBottom: theme.spacing.xl,
  },
  petsCarouselTitle: {
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.xs,
  },
  petsCarouselLabel: {
    ...theme.typography.label,
    color: theme.colors.TEXT_MUTED,
  },
  petsListContent: {
    paddingLeft: theme.spacing.xs,
  },
  messageButtonWrap: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
  },
  petItem: {
    alignItems: 'center',
    marginRight: theme.spacing.xl,
  },
  petNameWrap: {
    marginTop: theme.spacing.xs,
  },
  petName: {
    ...theme.typography.caption,
    maxWidth: PET_NAME_MAX_WIDTH,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
}));
