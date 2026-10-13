/**
 * Reusable card selector component for single-selection from horizontal cards.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Check } from 'src/lib/icons';

const CARD_OPTION_HEIGHT = 80;

export interface CardSelectorOption<T> {
  value: T;
  label: string;
  icon: React.ComponentType<{
    size: number;
    color?: string;
  }>;
}

interface CardSelectorProps<T> {
  options: CardSelectorOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  testID?: string;
}

export function CardSelector<T extends string>({
  options,
  selectedValue,
  onSelect,
  testID,
}: CardSelectorProps<T>) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedValue === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              testID={`${testID}-${option.value}`}
              activeOpacity={0.7}
              style={[
                styles.option,
                { borderColor: theme.colors.BORDER },
                isSelected
                  ? {
                      backgroundColor: theme.colors.PRIMARY + '1A',
                      borderColor: theme.colors.PRIMARY,
                    }
                  : { backgroundColor: theme.colors.SURFACE },
              ]}
              onPress={() => onSelect(option.value)}
            >
              <Icon
                size={24}
                color={
                  isSelected ? theme.colors.PRIMARY : theme.colors.TEXT_MUTED
                }
              />
              <Text style={[styles.label, { color: theme.colors.TEXT }]}>
                {option.label}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Check
                    size={theme.sizes.iconSm}
                    color={theme.colors.PRIMARY}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  option: {
    position: 'relative',
    height: CARD_OPTION_HEIGHT,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.md,
  },
  label: {
    ...theme.typography.button,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    right: theme.spacing.xs,
    top: theme.spacing.xs,
  },
}));
