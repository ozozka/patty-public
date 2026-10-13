import {
  BottomSheetFlatList,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ModalContainer } from 'src/component/common/ModalContainer';
import { ChevronDown, Search } from 'src/lib/icons';
import { androidTextProps } from 'src/utils/platform';

export interface CountryCode {
  id: string;
  name: string;
  code: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { id: 'TR', name: 'Turkey', code: '+90', flag: '🇹🇷' },
  { id: 'US', name: 'USA', code: '+1', flag: '🇺🇸' },
  { id: 'GB', name: 'UK', code: '+44', flag: '🇬🇧' },
  { id: 'DE', name: 'Germany', code: '+49', flag: '🇩🇪' },
  { id: 'FR', name: 'France', code: '+33', flag: '🇫🇷' },
  { id: 'IT', name: 'Italy', code: '+39', flag: '🇮🇹' },
  { id: 'ES', name: 'Spain', code: '+34', flag: '🇪🇸' },
  { id: 'NL', name: 'Netherlands', code: '+31', flag: '🇳🇱' },
  { id: 'BE', name: 'Belgium', code: '+32', flag: '🇧🇪' },
  { id: 'SE', name: 'Sweden', code: '+46', flag: '🇸🇪' },
  { id: 'NO', name: 'Norway', code: '+47', flag: '🇳🇴' },
  { id: 'FI', name: 'Finland', code: '+358', flag: '🇫🇮' },
  { id: 'DK', name: 'Denmark', code: '+45', flag: '🇩🇰' },
  { id: 'CH', name: 'Switzerland', code: '+41', flag: '🇨🇭' },
  { id: 'AT', name: 'Austria', code: '+43', flag: '🇦🇹' },
  { id: 'GR', name: 'Greece', code: '+30', flag: '🇬🇷' },
  { id: 'PT', name: 'Portugal', code: '+351', flag: '🇵🇹' },
  { id: 'IE', name: 'Ireland', code: '+353', flag: '🇮🇪' },
  { id: 'RU', name: 'Russia', code: '+7', flag: '🇷🇺' },
  { id: 'UA', name: 'Ukraine', code: '+380', flag: '🇺🇦' },
  { id: 'AZ', name: 'Azerbaijan', code: '+994', flag: '🇦🇿' },
  { id: 'GE', name: 'Georgia', code: '+995', flag: '🇬🇪' },
  { id: 'CN', name: 'China', code: '+86', flag: '🇨🇳' },
  { id: 'JP', name: 'Japan', code: '+81', flag: '🇯🇵' },
  { id: 'KR', name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { id: 'IN', name: 'India', code: '+91', flag: '🇮🇳' },
  { id: 'PK', name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { id: 'ID', name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { id: 'MY', name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { id: 'SG', name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { id: 'TH', name: 'Thailand', code: '+66', flag: '🇹🇭' },
  { id: 'VN', name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { id: 'PH', name: 'Philippines', code: '+63', flag: '🇵🇭' },
  { id: 'AU', name: 'Australia', code: '+61', flag: '🇦🇺' },
  { id: 'NZ', name: 'New Zealand', code: '+64', flag: '🇳🇿' },
  { id: 'AE', name: 'UAE', code: '+971', flag: '🇦🇪' },
  { id: 'SA', name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { id: 'QA', name: 'Qatar', code: '+974', flag: '🇶🇦' },
  { id: 'KW', name: 'Kuwait', code: '+965', flag: '🇰🇼' },
  { id: 'EG', name: 'Egypt', code: '+20', flag: '🇪🇬' },
  { id: 'MA', name: 'Morocco', code: '+212', flag: '🇲🇦' },
  { id: 'ZA', name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { id: 'NG', name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { id: 'KE', name: 'Kenya', code: '+254', flag: '🇰🇪' },
  { id: 'BR', name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { id: 'AR', name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { id: 'CL', name: 'Chile', code: '+56', flag: '🇨🇱' },
  { id: 'CO', name: 'Colombia', code: '+57', flag: '🇨🇴' },
  { id: 'MX', name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { id: 'CA', name: 'Canada', code: '+1', flag: '🇨🇦' },
  { id: 'IL', name: 'Israel', code: '+972', flag: '🇮🇱' },
  { id: 'IR', name: 'Iran', code: '+98', flag: '🇮🇷' },
  { id: 'IQ', name: 'Iraq', code: '+964', flag: '🇮🇶' },
];

export interface PhoneInputProps {
  label?: string;
  phoneNumber: string;
  onChangePhoneNumber: (fullNumber: string) => void;
  placeholder?: string;
  rightElement?: React.ReactNode;
  testID?: string;
}

export function PhoneInput({
  label,
  phoneNumber,
  onChangePhoneNumber,
  placeholder,
  rightElement,
  testID,
}: PhoneInputProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { currentCountry, localNumber } = useMemo(() => {
    const sortedCodes = [...COUNTRY_CODES].sort(
      (a, b) => b.code.length - a.code.length,
    );
    const found = sortedCodes.find((c) => phoneNumber.startsWith(c.code));
    if (found) {
      return {
        currentCountry: found,
        localNumber: phoneNumber.slice(found.code.length),
      };
    }
    const defaultCountry = COUNTRY_CODES[0] ?? {
      id: 'TR',
      name: 'Turkey',
      code: '+90',
      flag: '🇹🇷',
    };
    return {
      currentCountry: defaultCountry,
      localNumber: phoneNumber.startsWith('+') ? '' : phoneNumber,
    };
  }, [phoneNumber]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRY_CODES;
    const lowerQuery = searchQuery.toLowerCase();
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.code.includes(searchQuery),
    );
  }, [searchQuery]);

  const handleCountrySelect = (country: CountryCode) => {
    onChangePhoneNumber(country.code + localNumber);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleLocalNumberChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    onChangePhoneNumber(currentCountry.code + sanitized);
  };

  const handleClose = () => {
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelWrap}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          testID={`${testID}-country-selector`}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.countrySelector}>
            <View style={styles.flagWrap}>
              <Text style={styles.flagText}>{currentCountry.flag}</Text>
            </View>
            <View style={styles.codeWrap}>
              <Text style={styles.codeText}>{currentCountry.code}</Text>
            </View>
            <ChevronDown size={theme.sizes.iconSm} color={theme.colors.GRAY} />
          </View>
        </TouchableOpacity>

        <View style={styles.inputWrap}>
          <TextInput
            testID={`${testID}-input`}
            {...androidTextProps}
            style={styles.textInput}
            value={localNumber}
            onChangeText={handleLocalNumberChange}
            placeholder={placeholder ?? t('profile.phone')}
            placeholderTextColor={theme.colors.GRAY}
            keyboardType="phone-pad"
          />
        </View>
        {rightElement && (
          <View style={styles.rightElement}>{rightElement}</View>
        )}
      </View>

      <ModalContainer
        visible={modalVisible}
        onRequestClose={handleClose}
        maxHeight="85%"
        keyboardMode="avoid"
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.TEXT }]}>
            {t('profile.select_country')}
          </Text>
          <TouchableOpacity testID={`${testID}-cancel`} onPress={handleClose}>
            <Text
              style={[styles.cancelButton, { color: theme.colors.PRIMARY }]}
            >
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.searchContainer,
            {
              borderColor: theme.colors.BORDER,
              backgroundColor: theme.colors.COMPONENT,
            },
          ]}
        >
          <Search size={theme.sizes.icon} color={theme.colors.TEXT_MUTED} />
          <BottomSheetTextInput
            testID={`${testID}-search`}
            {...androidTextProps}
            style={styles.searchInput}
            placeholder={t('common.search')}
            placeholderTextColor={theme.colors.TEXT_MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={false}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <BottomSheetFlatList<CountryCode>
          data={filteredCountries}
          keyExtractor={(item: CountryCode) => item.id}
          renderItem={({ item }: { item: CountryCode }) => (
            <TouchableOpacity
              testID={`${testID}-country-${item.code}`}
              onPress={() => handleCountrySelect(item)}
            >
              <View
                style={[
                  styles.countryItem,
                  { borderBottomColor: theme.colors.BORDER },
                ]}
              >
                <View style={styles.countryItemRow}>
                  <View style={styles.countryInfo}>
                    <View style={styles.flagWrap}>
                      <Text style={styles.flagText}>{item.flag}</Text>
                    </View>
                    <Text
                      style={[styles.countryName, { color: theme.colors.TEXT }]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.countryCode,
                      { color: theme.colors.TEXT_MUTED },
                    ]}
                  >
                    {item.code}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
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
  labelWrap: {
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.GRAY,
  },
  inputContainer: {
    height: theme.heights.control,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.BORDER,
  },
  countrySelector: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  flagWrap: {
    marginRight: theme.spacing.xs,
  },
  flagText: {
    ...theme.typography.body,
  },
  codeWrap: {
    marginRight: theme.spacing.xs,
  },
  codeText: {
    ...theme.typography.body,
    color: theme.colors.TEXT,
  },
  inputWrap: {
    flex: 1,
    height: '100%',
    paddingHorizontal: theme.spacing.md,
  },
  textInput: {
    ...theme.typography.body,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.TEXT,
  },
  rightElement: {
    paddingRight: theme.spacing.md,
  },
  modalHeader: {
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    ...theme.typography.heading,
  },
  cancelButton: {
    ...theme.typography.button,
  },
  searchContainer: {
    marginBottom: theme.spacing.lg,
    height: theme.spacing.xl + 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.sm,
    paddingHorizontal: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  countryItem: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: theme.borderWidth.sm,
  },
  countryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryName: {
    ...theme.typography.body,
    marginLeft: theme.spacing.md,
  },
  countryCode: {
    ...theme.typography.label,
  },
}));
