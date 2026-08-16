const jwt = require('jsonwebtoken');
const { decryptSecret, encryptSecret } = require('./twoFactor');

const GOOGLE_PROVIDER = 'GOOGLE';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_CONNECT_PURPOSE = 'calendar_connect';
const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
];

function getAppBaseUrl() {
  return String(process.env.APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function isCalendarProviderReady(provider = GOOGLE_PROVIDER) {
  if (provider !== GOOGLE_PROVIDER) return false;

  return Boolean(
    process.env.GOOGLE_CALENDAR_CLIENT_ID &&
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET &&
    process.env.JWT_SECRET,
  );
}

function hasCalendarConnection(user) {
  return Boolean(user?.calendarProvider === GOOGLE_PROVIDER && user?.calendarRefreshToken);
}

function serializeCalendarConnection(user) {
  return {
    calendarSetupReady: isCalendarProviderReady(),
    calendarConnected: hasCalendarConnection(user),
    calendarProvider: user?.calendarProvider || null,
    calendarEmail: user?.calendarEmail || null,
    calendarSyncEnabled: Boolean(user?.calendarSyncEnabled),
    calendarConnectedAt: user?.calendarConnectedAt || null,
    calendarLastSyncedAt: user?.calendarLastSyncedAt || null,
    calendarSyncError: user?.calendarSyncError || '',
  };
}

function buildFrontendCalendarRedirectUrl({ status, message, returnTo = '/settings' }) {
  const appBaseUrl = getAppBaseUrl();
  const path = String(returnTo || '/settings').startsWith('/') ? String(returnTo || '/settings') : '/settings';
  const url = new URL(`${appBaseUrl}${path}`);
  if (status) url.searchParams.set('calendar_status', status);
  if (message) url.searchParams.set('calendar_message', message);
  return url.toString();
}

function buildCalendarTaskLink(task) {
  const appBaseUrl = getAppBaseUrl();
  if (task?.projectId && task?.id) {
    return `${appBaseUrl}/projects/${encodeURIComponent(task.projectId)}?taskId=${encodeURIComponent(task.id)}`;
  }
  return `${appBaseUrl}/calendar`;
}

function createCalendarConnectState({ userId, returnTo }) {
  return jwt.sign(
    {
      purpose: CALENDAR_CONNECT_PURPOSE,
      userId,
      returnTo: returnTo || '/settings',
    },
    process.env.JWT_SECRET,
    { expiresIn: '10m' },
  );
}

function verifyCalendarConnectState(state) {
  const decoded = jwt.verify(state, process.env.JWT_SECRET);
  if (decoded.purpose !== CALENDAR_CONNECT_PURPOSE || !decoded.userId) {
    throw new Error('Ungueltiger Kalender-Status');
  }

  return decoded;
}

function buildGoogleCalendarAuthorizationUrl({ userId, returnTo, redirectUri }) {
  if (!isCalendarProviderReady()) {
    throw new Error('Kalender-Integration ist auf dem Server noch nicht konfiguriert.');
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope: GOOGLE_SCOPES.join(' '),
    state: createCalendarConnectState({ userId, returnTo }),
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function exchangeGoogleToken(params) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || 'Google-Token konnte nicht geladen werden.');
  }

  return payload;
}

async function exchangeGoogleAuthorizationCode({ code, redirectUri }) {
  return exchangeGoogleToken({
    code,
    client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID,
    client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
}

async function refreshGoogleAccessToken(refreshToken) {
  const payload = await exchangeGoogleToken({
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID,
    client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });

  return payload.access_token;
}

async function getGoogleUserProfile(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || 'Google-Profil konnte nicht geladen werden.');
  }

  return payload;
}

async function googleCalendarRequest({ path, accessToken, method = 'GET', body, ignore404 = false }) {
  const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (ignore404 && response.status === 404) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || payload.error_description || 'Google Calendar Anfrage ist fehlgeschlagen.');
  }

  return payload;
}

function formatGoogleAllDayDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Ungueltiges Faelligkeitsdatum fuer Kalender-Sync.');
  }

  return date.toISOString().slice(0, 10);
}

function addOneDay(dateString) {
  const nextDate = new Date(`${dateString}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return nextDate.toISOString().slice(0, 10);
}

function formatStatusLabel(status) {
  const labels = {
    OPEN: 'Offen',
    IN_PROGRESS: 'In Bearbeitung',
    QA: 'QA / Review',
    BLOCKED: 'Blockiert',
    DONE: 'Erledigt',
    TODAY: 'Offen',
    THIS_WEEK: 'In Bearbeitung',
    LATER: 'Geplant',
  };

  return labels[String(status || '').toUpperCase()] || String(status || 'Offen');
}

function formatPriorityLabel(priority) {
  const labels = {
    LOW: 'Niedrig',
    MEDIUM: 'Mittel',
    HIGH: 'Hoch',
    URGENT: 'Dringend',
  };

  return labels[String(priority || '').toUpperCase()] || String(priority || 'Mittel');
}

function buildCalendarEventResource(task) {
  const startDate = formatGoogleAllDayDate(task.dueDate);
  const endDate = addOneDay(startDate);
  const description = [
    `Projekt: ${task.project?.name || 'Ohne Projekt'}`,
    `Status: ${formatStatusLabel(task.status)}`,
    `Prioritaet: ${formatPriorityLabel(task.priority)}`,
    '',
    task.description || 'Keine Beschreibung hinterlegt.',
    '',
    `Ticket: ${buildCalendarTaskLink(task)}`,
  ].join('\n');

  return {
    summary: task.title,
    description,
    start: { date: startDate },
    end: { date: endDate },
    source: {
      title: 'NextTask',
      url: buildCalendarTaskLink(task),
    },
    transparency: 'transparent',
    reminders: {
      useDefault: true,
    },
    extendedProperties: {
      private: {
        nextTaskTaskId: task.id,
        nextTaskProjectId: task.projectId,
      },
    },
  };
}

async function updateCalendarSyncError(prisma, userId, message) {
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      calendarSyncError: message || null,
    },
  }).catch(() => {});
}

async function getGoogleAccessTokenForUser(user) {
  if (!user?.calendarRefreshToken) {
    throw new Error('Kalender ist fuer diesen Benutzer nicht verbunden.');
  }

  return refreshGoogleAccessToken(decryptSecret(user.calendarRefreshToken));
}

async function removeCalendarSyncRecord(prisma, record) {
  if (!record) return;

  if (record.user?.calendarRefreshToken) {
    try {
      const accessToken = await getGoogleAccessTokenForUser(record.user);
      await googleCalendarRequest({
        path: `/calendars/primary/events/${encodeURIComponent(record.externalEventId)}`,
        accessToken,
        method: 'DELETE',
        ignore404: true,
      });
      await updateCalendarSyncError(prisma, record.user.id, null);
    } catch (error) {
      await updateCalendarSyncError(prisma, record.user.id, error.message);
    }
  }

  await prisma.calendarSyncEvent.delete({
    where: { id: record.id },
  }).catch(() => {});
}

async function removeTaskCalendarSyncs(prisma, taskId) {
  const syncRecords = await prisma.calendarSyncEvent.findMany({
    where: { taskId },
    include: {
      user: {
        select: {
          id: true,
          calendarRefreshToken: true,
        },
      },
    },
  });

  for (const record of syncRecords) {
    await removeCalendarSyncRecord(prisma, record);
  }
}

async function upsertGoogleTaskEvent(prisma, { user, task, existingRecord }) {
  const accessToken = await getGoogleAccessTokenForUser(user);
  const eventResource = buildCalendarEventResource(task);
  let event;

  if (existingRecord?.externalEventId) {
    event = await googleCalendarRequest({
      path: `/calendars/primary/events/${encodeURIComponent(existingRecord.externalEventId)}`,
      accessToken,
      method: 'PATCH',
      body: eventResource,
    });
  } else {
    event = await googleCalendarRequest({
      path: '/calendars/primary/events',
      accessToken,
      method: 'POST',
      body: eventResource,
    });
  }

  await prisma.calendarSyncEvent.upsert({
    where: {
      provider_userId_taskId: {
        provider: GOOGLE_PROVIDER,
        userId: user.id,
        taskId: task.id,
      },
    },
    update: {
      externalCalendarId: 'primary',
      externalEventId: event.id,
    },
    create: {
      provider: GOOGLE_PROVIDER,
      userId: user.id,
      taskId: task.id,
      externalCalendarId: 'primary',
      externalEventId: event.id,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      calendarLastSyncedAt: new Date(),
      calendarSyncError: null,
    },
  });
}

async function syncTaskCalendarEvent(prisma, taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          calendarProvider: true,
          calendarEmail: true,
          calendarRefreshToken: true,
          calendarSyncEnabled: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          key: true,
        },
      },
    },
  });

  const syncRecords = await prisma.calendarSyncEvent.findMany({
    where: { taskId },
    include: {
      user: {
        select: {
          id: true,
          calendarRefreshToken: true,
        },
      },
    },
  });

  const shouldSyncCurrentAssignee = Boolean(
    task?.assignee &&
    task?.dueDate &&
    task.assignee.calendarProvider === GOOGLE_PROVIDER &&
    task.assignee.calendarRefreshToken &&
    task.assignee.calendarSyncEnabled,
  );

  for (const record of syncRecords) {
    if (
      !shouldSyncCurrentAssignee ||
      !task ||
      record.userId !== task.assigneeId ||
      record.provider !== GOOGLE_PROVIDER
    ) {
      await removeCalendarSyncRecord(prisma, record);
    }
  }

  if (!task || !shouldSyncCurrentAssignee) {
    return;
  }

  try {
    const existingRecord = syncRecords.find(
      (record) => record.userId === task.assigneeId && record.provider === GOOGLE_PROVIDER,
    );
    await upsertGoogleTaskEvent(prisma, {
      user: task.assignee,
      task,
      existingRecord,
    });
  } catch (error) {
    await updateCalendarSyncError(prisma, task.assignee.id, error.message);
    throw error;
  }
}

async function syncUserCalendarTasks(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      calendarProvider: true,
      calendarEmail: true,
      calendarRefreshToken: true,
      calendarSyncEnabled: true,
      calendarConnectedAt: true,
      calendarLastSyncedAt: true,
      calendarSyncError: true,
    },
  });

  if (!user || !hasCalendarConnection(user)) {
    throw new Error('Kalender ist fuer diesen Benutzer nicht verbunden.');
  }

  if (!user.calendarSyncEnabled) {
    throw new Error('Kalender-Sync ist fuer diesen Benutzer deaktiviert.');
  }

  const [assignedTasks, syncRecords] = await Promise.all([
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        dueDate: { not: null },
      },
      select: { id: true },
    }),
    prisma.calendarSyncEvent.findMany({
      where: {
        userId,
        provider: GOOGLE_PROVIDER,
      },
      include: {
        user: {
          select: {
            id: true,
            calendarRefreshToken: true,
          },
        },
        task: {
          select: {
            id: true,
            assigneeId: true,
            dueDate: true,
          },
        },
      },
    }),
  ]);

  const activeTaskIds = new Set(assignedTasks.map((task) => task.id));

  for (const record of syncRecords) {
    if (!record.task || record.task.assigneeId !== userId || !record.task.dueDate || !activeTaskIds.has(record.task.id)) {
      await removeCalendarSyncRecord(prisma, record);
    }
  }

  for (const task of assignedTasks) {
    await syncTaskCalendarEvent(prisma, task.id);
  }

  const refreshedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      calendarLastSyncedAt: new Date(),
      calendarSyncError: null,
    },
  });

  return {
    syncedCount: assignedTasks.length,
    user: refreshedUser,
  };
}

async function disconnectUserCalendar(prisma, userId) {
  const syncRecords = await prisma.calendarSyncEvent.findMany({
    where: {
      userId,
      provider: GOOGLE_PROVIDER,
    },
    include: {
      user: {
        select: {
          id: true,
          calendarRefreshToken: true,
        },
      },
    },
  });

  for (const record of syncRecords) {
    await removeCalendarSyncRecord(prisma, record);
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      calendarProvider: null,
      calendarEmail: null,
      calendarRefreshToken: null,
      calendarSyncEnabled: false,
      calendarConnectedAt: null,
      calendarLastSyncedAt: null,
      calendarSyncError: null,
    },
  });
}

module.exports = {
  GOOGLE_PROVIDER,
  buildFrontendCalendarRedirectUrl,
  buildGoogleCalendarAuthorizationUrl,
  exchangeGoogleAuthorizationCode,
  getGoogleUserProfile,
  hasCalendarConnection,
  isCalendarProviderReady,
  serializeCalendarConnection,
  removeTaskCalendarSyncs,
  syncTaskCalendarEvent,
  syncUserCalendarTasks,
  disconnectUserCalendar,
  verifyCalendarConnectState,
  encryptCalendarRefreshToken: encryptSecret,
};
