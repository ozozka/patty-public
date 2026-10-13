import i18next from 'i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ActionButton } from './ActionButton';

export interface DatePickerProps {
  visible: boolean;
  value: Date | null;
  maxDate?: Date;
  minDate?: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  title?: string;
  testID?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ANIMATION_DURATION = 300;
const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = 180;
const SHEET_MIN_HEIGHT = 350;

function generateYears(maxDate: Date, minDate?: Date): number[] {
  const currentYear = maxDate.getFullYear();
  const startYear = minDate?.getFullYear() ?? currentYear - 30;
  const years: number[] = [];
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year);
  }
  return years;
}

function generateMonths(): number[] {
  return Array.from({ length: 12 }, (_, i) => i + 1);
}

function generateDays(year: number, month: number): number[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}

function getAgeString(day: number, month: number, year: number): string {
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  months -= birthDate.getMonth();
  months += today.getMonth();

  if (today.getDate() < birthDate.getDate()) {
    months--;
  }

  if (months < 0) return '';

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const t = i18next.t.bind(i18next);

  if (years > 0) {
    const yearStr = t('date.year', { count: years });
    if (remainingMonths > 0) {
      const monthStr = t('date.month', { count: remainingMonths });
      return `${yearStr} ${monthStr}`;
    }
    return yearStr;
  }

  return t('date.month', { count: remainingMonths });
}

interface WheelItemProps {
  item: number;
  label: string;
}

function WheelItem({ item, label }: WheelItemProps) {
  const { theme } = useUnistyles();
  return (
    <View style={styles.wheelItem}>
      <Text style={[styles.wheelItemText, { color: theme.colors.TEXT }]}>
        {item} {label}
      </Text>
    </View>
  );
}

interface WheelProps {
  data: number[];
  selectedValue: number;
  label: string;
  onSelect: (value: number) => void;
}

function Wheel({ data, selectedValue, label, onSelect }: WheelProps) {
  const { theme } = useUnistyles();
  const initialIndex = useMemo(
    () => data.findIndex((item) => item === selectedValue),
    [data, selectedValue],
  );

  const handleScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
      const selectedItem = data[clampedIndex];
      if (selectedItem !== undefined) {
        onSelect(selectedItem);
      }
    },
    [data, onSelect],
  );

  const renderItem = useCallback(
    ({ item }: { item: number }) => {
      return <WheelItem item={item} label={label} />;
    },
    [label],
  );

  const keyExtractor = useCallback((item: number) => item.toString(), []);

  const contentContainerStyle = useMemo(
    () => ({
      paddingVertical: ((VISIBLE_ITEMS - 1) * ITEM_HEIGHT) / 2,
      alignItems: 'center' as const,
    }),
    [],
  );

  return (
    <View style={styles.wheelContainer}>
      <View
        style={[
          styles.wheelHighlight,
          {
            borderColor: theme.colors.BORDER_LIGHT,
            backgroundColor: theme.colors.COMPONENT,
            top: ((VISIBLE_ITEMS - 1) * ITEM_HEIGHT) / 2,
          },
        ]}
        pointerEvents="none"
      />
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={contentContainerStyle}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialScrollIndex={initialIndex >= 0 ? initialIndex : undefined}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </View>
  );
}

export function DatePicker({
  visible,
  value,
  maxDate = new Date(),
  minDate,
  onClose,
  onConfirm,
  title,
  testID,
}: DatePickerProps) {
  const { t } = useTranslation();

  const today = useMemo(() => new Date(), []);
  const years = useMemo(
    () => generateYears(maxDate, minDate),
    [maxDate, minDate],
  );

  const [selectedYear, setSelectedYear] = useState<number>(
    value?.getFullYear() ?? today.getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    (value?.getMonth() ?? today.getMonth()) + 1,
  );
  const [selectedDay, setSelectedDay] = useState<number>(
    value?.getDate() ?? today.getDate(),
  );

  const days = useMemo(
    () => generateDays(selectedYear, selectedMonth),
    [selectedYear, selectedMonth],
  );

  const isMounted = useSharedValue(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const [active, setActive] = useState(visible);

  const displayTitle = title ?? t('datePicker.title');
  const ageString = getAgeString(selectedDay, selectedMonth, selectedYear);

  useEffect(() => {
    isMounted.value = true;
    return () => {
      isMounted.value = false;
    };
  }, [isMounted]);

  useEffect(() => {
    if (visible) {
      setActive(true);
      backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
      translateY.value = withTiming(0, { duration: ANIMATION_DURATION });
    } else {
      backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
      translateY.value = withTiming(
        SCREEN_HEIGHT,
        { duration: ANIMATION_DURATION },
        (finished) => {
          if (finished) {
            runOnJS(setActive)(false);
          }
        },
      );
    }
  }, [visible, translateY, backdropOpacity]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
    onConfirm(selectedDate);
  }, [selectedYear, selectedMonth, selectedDay, onConfirm]);

  useEffect(() => {
    if (visible && value) {
      setSelectedYear(value.getFullYear());
      setSelectedMonth(value.getMonth() + 1);
      setSelectedDay(value.getDate());
    }
  }, [visible, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleDayChange = useCallback((day: number) => {
    setSelectedDay(day);
  }, []);

  const handleMonthChange = useCallback(
    (month: number) => {
      setSelectedMonth(month);
      const newDays = generateDays(selectedYear, month);
      if (selectedDay > newDays.length) {
        setSelectedDay(newDays.length);
      }
    },
    [selectedYear, selectedDay],
  );

  const handleYearChange = useCallback(
    (year: number) => {
      setSelectedYear(year);
      const newDays = generateDays(year, selectedMonth);
      if (selectedDay > newDays.length) {
        setSelectedDay(newDays.length);
      }
    },
    [selectedMonth, selectedDay],
  );

  if (!active && !visible) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      testID={testID}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            testID={`${testID}-backdrop`}
            style={styles.backdropPressable}
            onPress={handleClose}
          />
        </Animated.View>
        <GestureDetector
          gesture={Gesture.Pan().onEnd((event) => {
            if (event.translationY > 100 || event.velocityY > 500) {
              runOnJS(handleClose)();
            }
          })}
        >
          <Animated.View style={[styles.sheet, animatedStyle]}>
            <View style={styles.handle}>
              <View style={styles.handleIndicator} />
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>{displayTitle}</Text>
            </View>

            <View style={styles.wheelsContainer}>
              <Wheel
                data={days}
                selectedValue={selectedDay}
                label=""
                onSelect={handleDayChange}
              />
              <Wheel
                data={generateMonths()}
                selectedValue={selectedMonth}
                label=""
                onSelect={handleMonthChange}
              />
              <Wheel
                data={years}
                selectedValue={selectedYear}
                label=""
                onSelect={handleYearChange}
              />
            </View>

            {ageString && (
              <View style={styles.ageContainer}>
                <Text style={styles.ageText}>{ageString}</Text>
              </View>
            )}

            <View style={styles.buttonsContainer}>
              <View style={styles.buttonsRow}>
                <ActionButton
                  testID={`${testID}-cancel`}
                  title={t('datePicker.cancel')}
                  onPress={handleClose}
                  type="ghost"
                  style={styles.button}
                />
                <ActionButton
                  testID={`${testID}-confirm`}
                  title={t('datePicker.confirm')}
                  onPress={handleConfirm}
                  type="primary"
                  style={styles.button}
                />
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.OVERLAY,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    minHeight: SHEET_MIN_HEIGHT,
    borderTopLeftRadius: theme.borderRadius['2xl'],
    borderTopRightRadius: theme.borderRadius['2xl'],
    backgroundColor: theme.colors.BACKGROUND,
    paddingBottom: theme.spacing['3xl'],
  },
  handle: {
    height: theme.heights.row,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleIndicator: {
    height: theme.heights.indicator,
    width: theme.spacing['4xl'],
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.BORDER,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.sectionHeader,
    textAlign: 'center',
    color: theme.colors.TEXT,
  },
  wheelsContainer: {
    marginHorizontal: theme.spacing.md,
    height: WHEEL_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    ...theme.typography.body,
  },
  wheelContainer: {
    height: WHEEL_HEIGHT,
    flex: 1,
    overflow: 'hidden',
  },
  wheelHighlight: {
    position: 'absolute',
    left: theme.spacing.xs,
    right: theme.spacing.xs,
    height: ITEM_HEIGHT,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
  },
  ageContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  ageText: {
    ...theme.typography.bodySmall,
    color: theme.colors.TEXT_SECONDARY,
  },
  buttonsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
  },
}));
