/** Source file for SearchableDropdown. */
import {
  BottomSheetFlatList,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  DimensionValue,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ModalContainer } from 'src/component/common/ModalContainer';
import { ChevronDown } from 'src/lib/icons';
import { androidTextProps } from 'src/utils/platform';

export interface DropdownItem {
  id: string | number;
  [key: string]: unknown;
}

export interface SearchableDropdownProps<T extends DropdownItem> {
  label?: string;
  data: T[];
  onSelect: (item: T) => void;
  selectedItem?: T | null;
  placeholder?: string;
  searchPlaceholder?: string;
  width?: DimensionValue;
  labelStyle?: StyleProp<TextStyle>;
  rightElement?: React.ReactNode;
  labelExtractor?: (item: T) => string;
  keyExtractor?: (item: T) => string;
  /** External control for modal visibility */
  modalVisible?: boolean;
  /** Callback when modal visibility changes */
  onModalVisibleChange?: (visible: boolean) => void;
  testID?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SearchableDropdown<T extends DropdownItem>({
  label,
  data = [],
  onSelect,
  selectedItem,
  placeholder,
  searchPlaceholder,
  width,
  labelStyle,
  rightElement,
  labelExtractor = (item: T) =>
    typeof item.name === 'string' ? item.name : String(item.id),
  keyExtractor = (item: T) => item.id.toString(),
  modalVisible: externalModalVisible,
  onModalVisibleChange,
  testID,
  disabled,
  style,
}: SearchableDropdownProps<T>) {
  const { theme } = useUnistyles();
  const { t } = useTranslation();
  const [internalModalVisible, setInternalModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isControlled = externalModalVisible !== undefined;
  const modalVisible = isControlled
    ? externalModalVisible
    : internalModalVisible;

  const setModalVisible = (visible: boolean) => {
    if (isControlled) {
      onModalVisibleChange?.(visible);
    } else {
      setInternalModalVisible(visible);
    }
  };

  const defaultPlaceholder = placeholder ?? t('common.select');
  const defaultSearchPlaceholder = searchPlaceholder ?? t('common.search');

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      labelExtractor(item)
        .toLocaleLowerCase('tr-TR')
        .includes(searchQuery.toLocaleLowerCase('tr-TR')),
    );
  }, [data, searchQuery, labelExtractor]);

  const handleSelect = (item: T) => {
    onSelect(item);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        {label && (
          <View style={styles.labelWrap}>
            <Text style={[styles.label, labelStyle]}>{label}</Text>
          </View>
        )}
        {rightElement && (
          <View style={styles.rightElement}>{rightElement}</View>
        )}
      </View>
      <TouchableOpacity
        testID={testID}
        style={{
          width: width ?? '100%',
        }}
        onPress={() => setModalVisible(true)}
        disabled={disabled}
      >
        <View style={styles.inputContainer}>
          <Text
            style={[
              styles.inputText,
              selectedItem
                ? styles.inputTextSelected
                : styles.inputTextPlaceholder,
            ]}
          >
            {selectedItem ? labelExtractor(selectedItem) : defaultPlaceholder}
          </Text>
          <ChevronDown
            size={theme.sizes.icon}
            color={theme.colors.TEXT_MUTED}
          />
        </View>
      </TouchableOpacity>

      <ModalContainer
        visible={modalVisible}
        onRequestClose={handleClose}
        maxHeight="70%"
        keyboardMode="avoid"
      >
        <View style={styles.modalContent}>
          <BottomSheetTextInput
            testID={`${testID}-search-input`}
            {...androidTextProps}
            style={styles.searchInput}
            placeholder={defaultSearchPlaceholder}
            placeholderTextColor={theme.colors.TEXT_MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity testID={`${testID}-cancel`} onPress={handleClose}>
            <Text style={styles.cancelButton}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>

        <BottomSheetFlatList<T>
          data={filteredData}
          keyExtractor={keyExtractor}
          renderItem={({ item }: { item: T }) => (
            <TouchableOpacity
              testID={`${testID}-item-${keyExtractor(item)}`}
              onPress={() => handleSelect(item)}
            >
              <View style={styles.itemContainer}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemText}>{labelExtractor(item)}</Text>
                  {typeof item.plate_code === 'string' && item.plate_code && (
                    <Text style={styles.itemCode}>{item.plate_code}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('common.no_results')}</Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
        />
      </ModalContainer>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    marginVertical: theme.spacing.sm,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelWrap: {
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.TEXT_MUTED,
  },
  rightElement: {
    paddingRight: theme.spacing.xs,
  },
  inputContainer: {
    height: theme.heights.control,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.BORDER,
    paddingHorizontal: theme.spacing.md,
  },
  inputText: {
    ...theme.typography.body,
    flex: 1,
  },
  inputTextSelected: {
    color: theme.colors.TEXT,
  },
  inputTextPlaceholder: {
    color: theme.colors.TEXT_MUTED,
  },
  modalContent: {
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderColor: theme.colors.BORDER,
    color: theme.colors.TEXT,
  },
  cancelButton: {
    ...theme.typography.button,
    color: theme.colors.PRIMARY,
  },
  itemContainer: {
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: theme.borderWidth.sm,
    borderBottomColor: theme.colors.BORDER,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: {
    ...theme.typography.body,
    color: theme.colors.TEXT,
  },
  itemCode: {
    ...theme.typography.label,
    color: theme.colors.TEXT_MUTED,
  },
  emptyContainer: {
    marginTop: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.caption,
    textAlign: 'center',
    color: theme.colors.TEXT_MUTED,
  },
}));
