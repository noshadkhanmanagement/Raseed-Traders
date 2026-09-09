// Formatting and Utility Functions for Scrap Management System

/**
 * Format number into Indian Rupee format, e.g. ₹1,25,000 or ₹38.50
 */
export function formatCurrency(amount: number, showDecimals = false): string {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : (absNum % 1 !== 0 ? 2 : 0),
    maximumFractionDigits: 2,
  }).format(absNum);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format quantity with decimal precision only when necessary
 */
export function formatQuantity(quantity: number, unit = 'KG'): string {
  const num = Number(quantity) || 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 3,
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
  }).format(num);

  return `${formatted} ${unit}`;
}

/**
 * Format date in Indian readable format: 08 Sep 2026
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  const parts = dateString.split('T')[0].split('-');
  if (parts.length !== 3) return dateString;

  const [year, month, day] = parts;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format timestamp into Indian 12-hour time format: 08:35 PM or 01:15 AM
 */
export function formatTime12Hr(dateString?: string): string {
  if (!dateString) return '';
  const trimmed = dateString.trim();
  // If it's a pure YYYY-MM-DD date without time, no time is available
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return '';

  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d).toUpperCase();
}

/**
 * Format date and exact 12-hour Indian time: 10 Sep 2026 · 01:15 AM
 */
export function formatDateTime12Hr(dateString?: string, createdAtString?: string): string {
  if (!dateString && !createdAtString) return '—';

  const datePart = formatDate(dateString || createdAtString);

  const timeSource =
    createdAtString && !/^\d{4}-\d{2}-\d{2}$/.test(createdAtString.trim())
      ? createdAtString
      : dateString && !/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())
        ? dateString
        : createdAtString;

  const timePart = formatTime12Hr(timeSource);

  if (!timePart) return datePart;
  return `${datePart} · ${timePart}`;
}

/**
 * Format Date object into local YYYY-MM-DD string without UTC offset shifts
 */
export function getLocalDateString(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Get date presets: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, This Year
 */
export function getDateRangePreset(preset: string): { startDate: string; endDate: string } {
  const today = new Date();
  const todayStr = getLocalDateString(today);

  switch (preset) {
    case 'TODAY':
      return { startDate: todayStr, endDate: todayStr };

    case 'YESTERDAY': {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      const yStr = getLocalDateString(y);
      return { startDate: yStr, endDate: yStr };
    }

    case 'LAST_7_DAYS': {
      const d = new Date(today);
      d.setDate(today.getDate() - 6);
      return { startDate: getLocalDateString(d), endDate: todayStr };
    }

    case 'LAST_30_DAYS': {
      const d = new Date(today);
      d.setDate(today.getDate() - 30);
      return { startDate: getLocalDateString(d), endDate: todayStr };
    }

    case 'THIS_MONTH': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: getLocalDateString(first), endDate: todayStr };
    }

    case 'LAST_MONTH': {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: getLocalDateString(first), endDate: getLocalDateString(last) };
    }

    case 'THIS_YEAR': {
      const first = new Date(today.getFullYear(), 0, 1);
      return { startDate: getLocalDateString(first), endDate: todayStr };
    }

    default:
      return { startDate: todayStr, endDate: todayStr };
  }
}

/**
 * Export arbitrary rows to a downloadable CSV file
 */
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((val) => {
          const str = String(val ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
