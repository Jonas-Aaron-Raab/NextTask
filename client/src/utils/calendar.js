export function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function fromDateKey(value) {
  return new Date(`${value}T00:00:00`);
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function startOfMonthGrid(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfWeek(first);
}

export function getMonthCalendarWeeks(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const firstGridDay = startOfWeek(firstDay);
  const weeks = [];

  for (let weekStart = firstGridDay; weekStart <= lastDay; weekStart = addDays(weekStart, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)));
  }

  return weeks;
}

export function formatShortDate(date) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(date);
}

export function formatReportShortDate(timestamp) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short' }).format(new Date(timestamp));
}

export function formatLongDate(timestamp) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(timestamp));
}

export function getTimelineSpan(startTime, endTime, rangeStart, totalRange) {
  return {
    left: ((startTime - rangeStart) / totalRange) * 100,
    width: ((endTime - startTime + 86400000) / totalRange) * 100,
  };
}

export function formatCompactDate(date) {
  return `${date.getDate()}.${date.getMonth() + 1}.`;
}

export function formatNumericDate(date, includeYear = false) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return includeYear ? `${day}.${month}.${date.getFullYear()}` : `${day}.${month}.`;
}

export function formatDateRangeTitle(view, cursorDate) {
  if (view === 'week') {
    const from = startOfWeek(cursorDate);
    const to = addDays(from, 6);
    return `${formatNumericDate(from)} - ${formatNumericDate(to, true)}`;
  }

  const from = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
  const to = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 0);
  return `${formatNumericDate(from)} - ${formatNumericDate(to, true)}`;
}

export function formatFullDate(value) {
  if (!value) return 'Keine Deadline';
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(fromDateKey(value));
}

export function getRange(view, cursorDate) {
  if (view === 'day') {
    return { from: cursorDate, to: cursorDate };
  }
  if (view === 'week') {
    const from = startOfWeek(cursorDate);
    return { from, to: addDays(from, 6) };
  }
  const from = startOfMonthGrid(cursorDate);
  return { from, to: addDays(from, 41) };
}

