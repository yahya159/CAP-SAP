export const getPeriodKey = (date: string): string => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const half = d.getDate() <= 15 ? 'H1' : 'H2';
  return `${year}-${month}-${half}`;
};

export const getPeriodRange = (periodKey: string): { start: string; end: string } => {
  const [yearMonth, half] = periodKey.split('-').reduce<string[]>((acc, part, i) => {
    if (i < 2) {
      if (acc.length === 0) acc.push(part);
      else acc[0] += '-' + part;
    } else acc.push(part);
    return acc;
  }, []);
  const [y, m] = yearMonth.split('-').map(Number);
  if (half === 'H1') {
    return {
      start: `${y}-${String(m).padStart(2, '0')}-01`,
      end: `${y}-${String(m).padStart(2, '0')}-15`,
    };
  }
  const lastDay = new Date(y, m, 0).getDate();
  return {
    start: `${y}-${String(m).padStart(2, '0')}-16`,
    end: `${y}-${String(m).padStart(2, '0')}-${lastDay}`,
  };
};

export const formatPeriodLabel = (key: string): string => {
  const parts = key.split('-');
  if (parts.length < 3) return key;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = parseInt(parts[1], 10) - 1;
  const half = parts[2] === 'H1' ? '1-15' : '16-end';
  return `${monthNames[m]} ${half} ${parts[0]}`;
};

export const validationColor: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  VALIDATED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
}

/** Format a Date as YYYY-MM-DD using local time (avoids UTC shift from toISOString). */
const toLocalDateStr = (d: Date): string => {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

export const generateCalendarDays = (calendarMonth: string): CalendarDay[] => {
  const [y, m] = calendarMonth.split('-').map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days: CalendarDay[] = [];

  for (let i = -startOffset; i <= lastDay.getDate() + (6 - ((lastDay.getDay() + 6) % 7)); i++) {
    const d = new Date(y, m - 1, i + 1);
    days.push({
      date: toLocalDateStr(d),
      day: d.getDate(),
      isCurrentMonth: d.getMonth() === m - 1,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }
  return days;
};
