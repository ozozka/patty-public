import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ModalContainer } from 'src/component/common/ModalContainer';
import type {
  ProfileCompletionAction,
  ProfileCompletionStep,
} from 'src/hooks/scenario/useProfileCompletion';
import { CheckCircle2, Plus } from 'src/lib/icons';

interface ProfileCompletionModalProps {
  isVisible: boolean;
  onClose: () => void;
  steps: ProfileCompletionStep[];
  onAction: (action: ProfileCompletionAction) => void;
}

export function ProfileCompletionModal({
  isVisible,
  onClose,
  steps,
  onAction,
}: ProfileCompletionModalProps) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();

  return (
    <ModalContainer
      visible={isVisible}
      onRequestClose={onClose}
      keyboardMode="none"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {t('profile.completion_modal_title')}
          </Text>
          <Text style={styles.description}>
            {t('profile.completion_modal_desc')}
          </Text>
        </View>

        <View style={styles.steps}>
          {steps.map((step) => (
            <TouchableOpacity
              testID={`profile-completion-step-${step.id}`}
              key={step.id}
              onPress={() => {
                if (!step.isCompleted) {
                  onAction(step.action);
                  onClose();
                }
              }}
              disabled={step.isCompleted}
              style={[
                styles.stepItem,
                step.isCompleted
                  ? styles.stepItemCompleted
                  : styles.stepItemActive,
              ]}
            >
              <View style={styles.stepIcon}>
                {step.isCompleted ? (
                  <CheckCircle2
                    size={theme.sizes.icon}
                    color={theme.colors.SUCCESS}
                  />
                ) : (
                  <Plus size={theme.sizes.icon} color={theme.colors.PRIMARY} />
                )}
              </View>
              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepLabel,
                    step.isCompleted
                      ? styles.stepLabelCompleted
                      : styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ModalContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    padding: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.heading,
    color: theme.colors.PRIMARY,
  },
  description: {
    ...theme.typography.body,
    marginTop: theme.spacing.sm,
    color: theme.colors.TEXT_MUTED,
  },
  steps: {
    gap: theme.spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
    borderWidth: theme.borderWidth.sm,
    padding: theme.spacing.md,
  },
  stepItemCompleted: {
    borderColor: 'transparent',
    backgroundColor: theme.colors.SURFACE_SUNKEN,
    opacity: 0.6,
  },
  stepItemActive: {
    borderColor: theme.colors.BORDER,
    backgroundColor: theme.colors.SURFACE,
  },
  stepIcon: {
    marginRight: theme.spacing.md,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    ...theme.typography.body,
  },
  stepLabelCompleted: {
    color: theme.colors.TEXT_MUTED,
    textDecorationLine: 'line-through',
  },
  stepLabelActive: {
    color: theme.colors.TEXT,
  },
}));
