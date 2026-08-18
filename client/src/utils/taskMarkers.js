import api from '../api/axios';

const taskMarkerStorageKey = 'nexttask:task-marker-settings';

export const defaultTaskMarkers = [
  {
    id: 'marker-high',
    label: 'Hohe Priorität',
    description: 'Aufgaben mit hoher Priorität.',
    color: '#ef4444',
    matchField: 'priority',
    matchValue: 'hoch',
  },
  {
    id: 'marker-medium',
    label: 'Mittlere Priorität',
    description: 'Aufgaben mit mittlerer Priorität.',
    color: '#f59e0b',
    matchField: 'priority',
    matchValue: 'mittel',
  },
  {
    id: 'marker-low',
    label: 'Niedrige Priorität',
    description: 'Aufgaben mit niedriger Priorität.',
    color: '#10b981',
    matchField: 'priority',
    matchValue: 'niedrig',
  },
  {
    id: 'marker-review',
    label: 'Review',
    description: 'Aufgaben, die auf Rückmeldung oder Abnahme warten.',
    color: '#8b5cf6',
    matchField: 'status',
    matchValue: 'review',
  },
  {
    id: 'marker-blocked',
    label: 'Blockiert',
    description: 'Aufgaben mit Hindernis oder Eskalationsbedarf.',
    color: '#e11d48',
    matchField: 'status',
    matchValue: 'blocked',
  },
];

export const taskMarkerMatchFields = [
  { value: '', label: 'Keine Zuordnung' },
  { value: 'priority', label: 'Priorität' },
  { value: 'status', label: 'Status' },
  { value: 'project', label: 'Projekt' },
  { value: 'tag', label: 'Tag' },
];

export const taskMarkerQuickColors = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#64748b',
  '#111827',
];

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeMarkers(markers) {
  return Array.isArray(markers) && markers.length ? markers : defaultTaskMarkers;
}

export function getStoredTaskMarkers() {
  if (typeof window === 'undefined') return defaultTaskMarkers;

  const raw = window.localStorage.getItem(taskMarkerStorageKey);
  if (!raw) return defaultTaskMarkers;

  try {
    return normalizeMarkers(JSON.parse(raw));
  } catch {
    return defaultTaskMarkers;
  }
}

export function storeTaskMarkers(markers) {
  const normalizedMarkers = normalizeMarkers(markers);
  if (typeof window === 'undefined') return normalizedMarkers;

  window.localStorage.setItem(taskMarkerStorageKey, JSON.stringify(normalizedMarkers));
  window.dispatchEvent(new CustomEvent('nexttask:task-markers-change', { detail: normalizedMarkers }));
  return normalizedMarkers;
}

export function clearStoredTaskMarkers() {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(taskMarkerStorageKey);
  window.dispatchEvent(new CustomEvent('nexttask:task-markers-change', { detail: defaultTaskMarkers }));
}

export async function loadTaskMarkersFromApi() {
  const { data } = await api.get('/task-markers');
  return storeTaskMarkers(data.markers);
}

export async function saveTaskMarkersToApi(markers) {
  const { data } = await api.put('/task-markers', { markers: normalizeMarkers(markers) });
  return storeTaskMarkers(data.markers);
}

export function resetTaskMarkers() {
  return storeTaskMarkers(defaultTaskMarkers);
}

export function createTaskMarker() {
  return {
    id: `marker-${Date.now()}`,
    label: 'Neue Markierung',
    description: '',
    color: '#3b82f6',
    matchField: '',
    matchValue: '',
  };
}

export function getTaskMarker(task, markers = getStoredTaskMarkers()) {
  if (!task) return defaultTaskMarkers[1];

  const explicitMarker = markers.find((marker) => marker.id && marker.id === task.markerId);
  if (explicitMarker) return explicitMarker;

  const defaultMarkerIds = new Set(defaultTaskMarkers.map((marker) => marker.id));
  const orderedMarkers = [
    ...markers.filter((marker) => !defaultMarkerIds.has(marker.id)),
    ...markers.filter((marker) => defaultMarkerIds.has(marker.id)),
  ];

  const marker = orderedMarkers.find((candidate) => {
    const matchValue = normalizeValue(candidate.matchValue);
    if (!candidate.matchField || !matchValue) return false;

    if (candidate.matchField === 'status') return normalizeValue(task.status) === matchValue;
    if (candidate.matchField === 'priority') return normalizeValue(task.priority) === matchValue;
    if (candidate.matchField === 'project') return normalizeValue(task.project?.name || task.project) === matchValue;
    if (candidate.matchField === 'tag') return (task.tags || []).some((tag) => normalizeValue(tag) === matchValue);

    return false;
  });

  return marker || defaultTaskMarkers[1];
}