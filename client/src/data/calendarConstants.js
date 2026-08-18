export const viewOptions = [
  { id: 'month', label: 'Monat' },
  { id: 'week', label: 'Woche' },
];

export const calendarWeekDays = [
  { index: 1, short: 'Mo', label: 'Montag' },
  { index: 2, short: 'Di', label: 'Dienstag' },
  { index: 3, short: 'Mi', label: 'Mittwoch' },
  { index: 4, short: 'Do', label: 'Donnerstag' },
  { index: 5, short: 'Fr', label: 'Freitag' },
  { index: 6, short: 'Sa', label: 'Samstag' },
  { index: 0, short: 'So', label: 'Sonntag' },
];

export const statusLabels = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Bearbeitung',
  QA: 'QA',
  BLOCKED: 'Blockiert',
  DONE: 'Erledigt',
};

export const statusColors = {
  OPEN: 'border-blue-200 bg-blue-50 text-blue-700',
  IN_PROGRESS: 'border-orange-200 bg-orange-50 text-orange-700',
  QA: 'border-teal-200 bg-teal-50 text-teal-700',
  BLOCKED: 'border-slate-300 bg-slate-100 text-slate-700',
  DONE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export const priorityLabels = {
  LOW: 'Niedrig',
  MEDIUM: 'Normal',
  HIGH: 'Hoch',
  URGENT: 'Kritisch',
};
