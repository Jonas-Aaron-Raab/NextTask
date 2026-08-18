export const hoursPerWorkDay = 8;

export const effortUnitOptions = [
  { value: 'hours', label: 'Stunden' },
  { value: 'days', label: 'Tage' },
];

export function parseEffortHours(value) {
  if (value === '' || value === null || value === undefined) return 0;

  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function sumEffortHours(items) {
  return items.reduce((sum, item) => sum + parseEffortHours(item?.estimatedHours), 0);
}

export function getEffortInputValue(hours, unit = 'hours') {
  const value = unit === 'days' ? parseEffortHours(hours) / hoursPerWorkDay : parseEffortHours(hours);
  if (!value) return '';
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

export function getEffortHoursFromInput(value, unit = 'hours') {
  if (value === '' || value === null || value === undefined) return '';

  const parsed = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) return '';
  const hours = unit === 'days' ? parsed * hoursPerWorkDay : parsed;
  return Number.isInteger(hours) ? String(hours) : String(Number(hours.toFixed(2)));
}

export function formatEffort(hours, unit = 'hours') {
  const value = unit === 'days' ? parseEffortHours(hours) / hoursPerWorkDay : parseEffortHours(hours);
  const suffix = unit === 'days' ? 'Tage' : 'Std.';

  return `${new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: 1,
  }).format(value)} ${suffix}`;
}
