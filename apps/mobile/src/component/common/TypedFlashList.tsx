/**
 * Type-safe FlashList wrapper.
 * Passes each prop explicitly to avoid spreading `unknown` index signature props
 * onto FlashList, while keeping full generic type inference via JSX syntax.
 */
import type { ListRenderItemInfo } from '@shopify/flash-list';
import { FlashList } from '@shopify/flash-list';
import type React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';

export interface TypedFlashListProps<T> {
  data: readonly T[] | null | undefined;
  renderItem:
    | ((info: ListRenderItemInfo<T>) => React.ReactElement | null)
    | null
    | undefined;
  keyExtractor?: (item: T, index: number) => string;
  estimatedItemSize?: number;
  horizontal?: boolean;
  inverted?: boolean;
  numColumns?: number;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  keyboardDismissMode?: 'none' | 'interactive' | 'on-drag';
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  ListEmptyComponent?: React.ComponentType | React.ReactElement | null;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType | React.ReactElement | null;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  testID?: string;
  [key: string]: unknown;
}

export function TypedFlashList<T>(props: TypedFlashListProps<T>) {
  return (
    <FlashList<T>
      data={props.data}
      renderItem={props.renderItem}
      keyExtractor={props.keyExtractor}
      horizontal={props.horizontal}
      numColumns={props.numColumns}
      showsHorizontalScrollIndicator={props.showsHorizontalScrollIndicator}
      showsVerticalScrollIndicator={props.showsVerticalScrollIndicator}
      contentContainerStyle={props.contentContainerStyle}
      style={StyleSheet.flatten(props.style)}
      keyboardDismissMode={props.keyboardDismissMode}
      keyboardShouldPersistTaps={props.keyboardShouldPersistTaps}
      ListEmptyComponent={props.ListEmptyComponent}
      ListHeaderComponent={props.ListHeaderComponent}
      ListFooterComponent={props.ListFooterComponent}
      onEndReached={props.onEndReached}
      onEndReachedThreshold={props.onEndReachedThreshold}
      testID={props.testID}
    />
  );
}
