import {
  calculateAge,
  formatAge,
  formatMessageDate,
  formatTimeAgo,
} from '../date';

// Mock i18next
type MockT = (key: string, options?: Record<string, unknown>) => string;
const mockT: MockT = (key: string, options?: Record<string, unknown>) => {
  if (key === 'date.year') {
    const count = typeof options?.count === 'number' ? options.count : 0;
    return `${count} year${count === 1 ? '' : 's'}`;
  }
  if (key === 'date.month') {
    const count = typeof options?.count === 'number' ? options.count : 0;
    return `${count} month${count === 1 ? '' : 's'}`;
  }

  const translations: Record<string, string> = {
    'date.just_now': 'just now',
    'date.min_short': 'm',
    'date.hour_short': 'h',
    'date.day_short': 'd',
    'date.yesterday': 'Yesterday',
    'date.today': 'Today',
  };
  return translations[key] ?? key;
};

jest.mock('i18next', () => ({
  t: (key: string, options?: Record<string, unknown>) => mockT(key, options),
}));

describe('calculateAge', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const nullishInputs = [null, undefined, ''];

  it.each(nullishInputs)('returns undefined for %p input', (input) => {
    expect(calculateAge(input)).toBeUndefined();
  });

  it('calculates age correctly for a birth date', () => {
    // Set current date to 2026-02-20
    jest.setSystemTime(new Date('2026-02-20'));

    // Born in 2020, should be 6 years old
    expect(calculateAge('2020-01-01')).toBe(6);

    // Born in 2019, should be 7 years old
    expect(calculateAge('2019-06-15')).toBe(6);

    // Born in 2025, should be 0 or 1 depending on month
    expect(calculateAge('2025-01-01')).toBe(1);
  });

  it('adjusts age based on whether birthday has passed this year', () => {
    jest.setSystemTime(new Date('2026-02-20'));

    // Birthday already passed this year (Jan 15)
    expect(calculateAge('2020-01-15')).toBe(6);

    // Birthday not yet passed this year (Mar 15)
    expect(calculateAge('2020-03-15')).toBe(5);

    // Birthday is today
    expect(calculateAge('2020-02-20')).toBe(6);
  });

  it('handles edge cases at year boundaries', () => {
    jest.setSystemTime(new Date('2026-01-01'));

    // Just turned 6 yesterday (Dec 31, 2020)
    expect(calculateAge('2020-12-31')).toBe(5);

    // Born today, 5 years ago
    expect(calculateAge('2021-01-01')).toBe(5);
  });
});

describe('formatAge', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Set current date to 2026-02-20
    jest.setSystemTime(new Date('2026-02-20'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const nullishInputs = [null, undefined, ''];

  it.each(nullishInputs)('returns undefined for %p input', (input) => {
    expect(formatAge(input)).toBeUndefined();
  });

  it('formats age with years and months', () => {
    // 2 years exactly
    expect(formatAge('2024-02-20')).toBe('2 years');

    // 2 years 1 month
    expect(formatAge('2024-01-20')).toBe('2 years 1 month');

    // 2 years 11 months
    expect(formatAge('2023-03-20')).toBe('2 years 11 months');
  });

  it('formats age with only months for < 1 year', () => {
    // 6 months
    expect(formatAge('2025-08-20')).toBe('6 months');

    // 11 months
    expect(formatAge('2025-03-20')).toBe('11 months');

    // 0 months (less than a month)
    expect(formatAge('2026-02-10')).toBe('0 months');
  });

  it('handles edge cases', () => {
    // Future date
    expect(formatAge('2027-01-01')).toBeUndefined();
  });
});

describe('formatTimeAgo', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-20T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const nullishInputs = [null, undefined];

  it.each(nullishInputs)('returns empty string for %p input', (input) => {
    expect(formatTimeAgo(input)).toBe('');
  });

  it('formats just now for recent times', () => {
    expect(formatTimeAgo(new Date('2026-02-20T11:59:30'))).toBe('just now');
    expect(formatTimeAgo(new Date('2026-02-20T11:59:01'))).toBe('just now');
  });

  it('formats minutes for times within the hour', () => {
    expect(formatTimeAgo(new Date('2026-02-20T11:55:00'))).toBe('5m');
    expect(formatTimeAgo(new Date('2026-02-20T11:30:00'))).toBe('30m');
  });

  it('formats hours for times within the day', () => {
    expect(formatTimeAgo(new Date('2026-02-20T10:00:00'))).toBe('2h');
    expect(formatTimeAgo(new Date('2026-02-20T00:00:00'))).toBe('12h');
  });

  it('formats yesterday for yesterday', () => {
    expect(formatTimeAgo(new Date('2026-02-19T12:00:00'))).toBe('Yesterday');
  });

  it('formats days for times within the week', () => {
    // More than 24 hours ago but not yesterday (different calendar day)
    expect(formatTimeAgo(new Date('2026-02-18T10:00:00'))).toBe('2d');
    expect(formatTimeAgo(new Date('2026-02-15T12:00:00'))).toBe('5d');
  });

  it('formats date for times older than a week', () => {
    expect(formatTimeAgo(new Date('2026-02-10T12:00:00'))).toBe('Feb 10');
  });
});

describe('formatMessageDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-20T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const nullishInputs = [null, undefined];

  it.each(nullishInputs)('returns empty string for %p input', (input) => {
    expect(formatMessageDate(input)).toBe('');
  });

  it('formats today for current day', () => {
    expect(formatMessageDate(new Date('2026-02-20T10:00:00'))).toBe('Today');
  });

  it('formats yesterday for previous day', () => {
    expect(formatMessageDate(new Date('2026-02-19T10:00:00'))).toBe(
      'Yesterday',
    );
  });

  it('formats full date for older dates', () => {
    const result = formatMessageDate(new Date('2026-02-15T10:00:00'));
    expect(result).toContain('Feb');
    expect(result).toContain('15');
  });
});
