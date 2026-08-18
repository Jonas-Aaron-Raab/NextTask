const germanMonths = {
  januar: '01',
  februar: '02',
  maerz: '03',
  april: '04',
  mai: '05',
  juni: '06',
  juli: '07',
  august: '08',
  september: '09',
  oktober: '10',
  november: '11',
  dezember: '12',
};

const statusMap = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  QA: 'QA',
  BLOCKED: 'BLOCKED',
  DONE: 'DONE',
  today: 'OPEN',
  'in-progress': 'IN_PROGRESS',
  review: 'QA',
  todo: 'OPEN',
  progress: 'IN_PROGRESS',
  blocked: 'BLOCKED',
  done: 'DONE',
  TODAY: 'OPEN',
  THIS_WEEK: 'IN_PROGRESS',
  LATER: 'OPEN',
};

const priorityMap = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
  niedrig: 'LOW',
  mittel: 'MEDIUM',
  hoch: 'HIGH',
  kritisch: 'URGENT',
};

function normalizeMonth(value) {
  return String(value || '')
    .toLowerCase()
    .replace('ä', 'ae')
    .replace('ö', 'oe')
    .replace('ü', 'ue');
}

export function toTaskDateValue(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const match = text.match(/^(\d{1,2})\.\s*([A-Za-zÄÖÜäöü]+)\s+(\d{4})$/);
  if (!match) return '';

  const [, day, monthName, year] = match;
  const month = germanMonths[normalizeMonth(monthName)];
  return month ? `${year}-${month}-${day.padStart(2, '0')}` : '';
}

export function taskDateTimestamp(value) {
  const dateValue = toTaskDateValue(value);
  return dateValue ? new Date(`${dateValue}T00:00:00`).getTime() : Number.POSITIVE_INFINITY;
}

export function normalizeTaskStatus(status) {
  return statusMap[status] || 'OPEN';
}

export function normalizeTaskPriority(priority) {
  return priorityMap[priority] || 'MEDIUM';
}

export function toDashboardStatus(status) {
  const dashboardMap = {
    OPEN: 'today',
    IN_PROGRESS: 'in-progress',
    QA: 'review',
    BLOCKED: 'blocked',
    DONE: 'done',
  };
  return dashboardMap[normalizeTaskStatus(status)] || 'today';
}

export function toDashboardPriority(priority) {
  const dashboardMap = { LOW: 'niedrig', MEDIUM: 'mittel', HIGH: 'hoch', URGENT: 'hoch' };
  return dashboardMap[normalizeTaskPriority(priority)] || 'mittel';
}
