import { jest } from '@jest/globals';

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const actualNavObj =
    typeof actualNav === 'object' && actualNav !== null ? actualNav : {};
  return {
    ...actualNavObj,
    useNavigation: jest.fn(() => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      setParams: jest.fn(),
    })),
    useRoute: jest.fn(() => ({
      params: {},
    })),
  };
});
