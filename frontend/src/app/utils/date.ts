// Date helpers that avoid UTC conversion side effects in local-date UIs.

type DateInput = Date | string | number | null | undefined;

const DEFAULT_LOCALE = typeof navigator !== 'undefined' ? navigator.language : 'en-GB';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH_RE = /^\d{4}-\d{2}$/;

const parseDateInput = (value: DateInput): Date | null => {
  if (value == null || value === '') return null;
  if (value instanceof Date) return new Date(value);

  if (typeof value === 'string') {
    if (ISO_DATE_RE.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    if (ISO_MONTH_RE.test(value)) {
      const [year, month] = value.split('-').map(Number);
      return new Date(year, month - 1, 1);
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const resolveLocale = (language?: string, fallback = DEFAULT_LOCALE): string => {
  if (!language) return fallback;

  const normalized = language.toLowerCase();
  if (normalized.startsWith('fr')) return 'fr-FR';
  if (normalized.startsWith('en')) return 'en-GB';
  return language;
};

export const formatDate = (
  value: DateInput,
  language?: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = parseDateInput(value);
  if (!date) return '-';

  return new Intl.DateTimeFormat(resolveLocale(language), options ?? { dateStyle: 'medium' }).format(date);
};

export const formatDateTime = (
  value: DateInput,
  language?: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = parseDateInput(value);
  if (!date) return '-';

  return new Intl.DateTimeFormat(
    resolveLocale(language),
    options ?? { dateStyle: 'medium', timeStyle: 'short' }
  ).format(date);
};

export const formatMonthYear = (value: DateInput, language?: string): string =>
  formatDate(value, language, { month: 'long', year: 'numeric' });

export const formatNumber = (
  value: number | string | null | undefined,
  language?: string,
  options?: Intl.NumberFormatOptions
): string => {
  if (value == null || value === '') return '-';

  const parsed = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(parsed)) return String(value);

  return new Intl.NumberFormat(resolveLocale(language), options).format(parsed);
};

export const toLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayLocalDateKey = (): string => toLocalDateKey(new Date());

export const getMondayOfWeek = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + delta);
  return start;
};

export const getFridayOfWeek = (date: Date): Date => {
  const friday = new Date(getMondayOfWeek(date));
  friday.setDate(friday.getDate() + 4);
  return friday;
};

export const getISOWeekInputValue = (date: Date): string => {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const dayNr = (target.getDay() + 6) % 7; // Monday=0 ... Sunday=6
  target.setDate(target.getDate() - dayNr + 3); // Thursday of this ISO week

  const firstThursday = new Date(target.getFullYear(), 0, 4);
  firstThursday.setHours(0, 0, 0, 0);
  const firstDayNr = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3);

  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / 604800000);
  return `${target.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

export const parseISOWeekInputValue = (value: string): Date => {
  const [yearStr, weekStr] = value.split('-W');
  const year = Number(yearStr);
  const week = Number(weekStr);
  if (!year || !week) return new Date();

  const jan4 = new Date(year, 0, 4);
  jan4.setHours(0, 0, 0, 0);
  const jan4DayNr = (jan4.getDay() + 6) % 7;

  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - jan4DayNr);

  const monday = new Date(mondayWeek1);
  monday.setDate(mondayWeek1.getDate() + (week - 1) * 7);
  return monday;
};
