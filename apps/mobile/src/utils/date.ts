import { t } from 'i18next';

/**
 * Formats a date or ISO string into a relative time string (e.g. "2m ago", "3h ago", "Yesterday", "Feb 15").
 */
export function formatTimeAgo(
  dateInput: Date | string | undefined | null,
): string {
  if (!dateInput) return '';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return t('date.just_now');
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}${t('date.min_short')}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}${t('date.hour_short')}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return t('date.yesterday');
  }

  if (diffInDays < 7) {
    return `${diffInDays}${t('date.day_short')}`;
  }

  // Older than a week, return formatted date
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Formats a date for chat separators (Today, Yesterday, or full date).
 */
export function formatMessageDate(
  dateInput: Date | string | undefined | null,
): string {
  if (!dateInput) return '';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return t('date.today');

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return t('date.yesterday');

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a Date object to a localized date string for display in forms.
 */
export function formatDateForForm(
  date: Date | null,
  placeholder: string,
): string {
  return date ? date.toLocaleDateString() : placeholder;
}

/**
 * Calculates age in years from a birth date string (YYYY-MM-DD).
 */
export function calculateAge(
  birthDateString?: string | null,
): number | undefined {
  if (!birthDateString) return undefined;

  const birthDate = new Date(birthDateString);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Formats age into a localized string (e.g. "2y 3m", "5m").
 */
export function formatAge(birthDateString?: string | null): string | undefined {
  if (!birthDateString) return undefined;

  const birthDate = new Date(birthDateString);
  const today = new Date();

  let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  months -= birthDate.getMonth();
  months += today.getMonth();

  // Adjust for day of month
  if (today.getDate() < birthDate.getDate()) {
    months--;
  }

  if (months < 0) return undefined;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

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
