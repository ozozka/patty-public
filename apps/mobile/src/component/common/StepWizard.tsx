import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActionButton } from 'src/component/common/ActionButton';

export interface StepWizardProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
  isLoading?: boolean;
  nextButtonText?: string;
}

function StepDot({
  index,
  currentStep,
  colors,
}: {
  index: number;
  currentStep: number;
  colors: { PRIMARY: string; SUCCESS: string; BORDER: string };
}) {
  const isActive = index === currentStep;
  const isCompleted = index < currentStep;

  const animatedStyle = useAnimatedStyle(() => {
    const scale = withSpring(isActive ? 1.2 : 1, {
      damping: 15,
      stiffness: 150,
    });

    return {
      transform: [{ scale }],
      backgroundColor: isActive
        ? colors.PRIMARY
        : isCompleted
          ? colors.SUCCESS
          : colors.BORDER,
      width: withSpring(isActive ? 10 : 8),
      height: withSpring(isActive ? 10 : 8),
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

function StepContent({
  children,
  currentStep,
}: {
  children: React.ReactNode;
  currentStep: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(1, { damping: 20, stiffness: 100 }),
      transform: [
        {
          translateX: withSpring(0, { damping: 15, stiffness: 120 }),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.content, animatedStyle]} key={currentStep}>
      {children}
    </Animated.View>
  );
}

export function StepWizard({
  currentStep,
  totalSteps,
  children,
  onNext,
  canProceed,
  isLoading = false,
  nextButtonText,
}: StepWizardProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSteps }, (_, i) => i).map((index) => (
            <StepDot
              key={index}
              index={index}
              currentStep={currentStep}
              colors={theme.colors}
            />
          ))}
        </View>
      </View>

      <View style={styles.contentContainer}>
        <StepContent currentStep={currentStep}>{children}</StepContent>
      </View>

      <View style={styles.buttonContainer}>
        <ActionButton
          title={
            nextButtonText ??
            (isLastStep
              ? t('common.complete_button')
              : t('common.continue_button'))
          }
          onPress={onNext}
          disabled={!canProceed || isLoading}
          loading={isLoading}
          size="md"
          style={styles.button}
          testID="step-wizard-next-button"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    flexGrow: 1,
  },
  dotsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dot: {
    borderRadius: theme.borderRadius.full,
  },
  contentContainer: {
    marginBottom: theme.spacing['3xl'],
    width: '100%',
    flexGrow: 1,
  },
  content: {
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
    paddingBottom: theme.spacing['4xl'],
  },
  button: {
    flex: 1,
  },
}));
