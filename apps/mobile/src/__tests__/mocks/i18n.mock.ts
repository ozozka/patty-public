import { jest } from '@jest/globals';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

const mockI18n = {
  changeLanguage: jest.fn(),
  language: 'en',
  isInitialized: true,
  t: jest.fn((key: string) => key),
};

jest.mock('src/i18n', () => ({
  i18n: mockI18n,
  ...mockI18n,
}));

jest.mock('i18next', () => ({
  t: (key: string) => key,
  changeLanguage: jest.fn(),
  language: 'en',
  isInitialized: true,
}));
