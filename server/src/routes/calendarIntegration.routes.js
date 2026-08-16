const express = require('express');
const auth = require('../middleware/auth');
const { writeAuditLog } = require('../utils/auditLog');
const {
  buildFrontendCalendarRedirectUrl,
  buildGoogleCalendarAuthorizationUrl,
  disconnectUserCalendar,
  encryptCalendarRefreshToken,
  exchangeGoogleAuthorizationCode,
  getGoogleUserProfile,
  isCalendarProviderReady,
  serializeCalendarConnection,
  syncUserCalendarTasks,
  verifyCalendarConnectState,
} = require('../utils/calendarIntegration');

const router = express.Router();

function getRedirectUri(req) {
  return `${req.protocol}://${req.get('host')}/api/calendar-integration/callback`;
}

router.post('/connect-url', auth, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.status(400).json({ message: 'Im Gastmodus kann kein Kalender verbunden werden.' });
    }

    if (!isCalendarProviderReady()) {
      return res.status(400).json({ message: 'Kalender-Integration ist auf dem Server noch nicht konfiguriert.' });
    }

    const authorizationUrl = buildGoogleCalendarAuthorizationUrl({
      userId: req.user.id,
      returnTo: req.body?.returnTo || '/settings',
      redirectUri: getRedirectUri(req),
    });

    res.json({ authorizationUrl });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Kalender-Verbindung konnte nicht gestartet werden.' });
  }
});

router.get('/callback', async (req, res) => {
  if (req.query.error) {
    return res.redirect(
      buildFrontendCalendarRedirectUrl({
        status: 'error',
        message: req.query.error_description || req.query.error || 'Kalender-Verbindung wurde abgebrochen.',
      }),
    );
  }

  try {
    const { code, state } = req.query;
    if (!code || !state) {
      throw new Error('Kalender-Callback ist unvollstaendig.');
    }

    const decodedState = verifyCalendarConnectState(String(state));
    const tokenPayload = await exchangeGoogleAuthorizationCode({
      code: String(code),
      redirectUri: getRedirectUri(req),
    });

    if (!tokenPayload.refresh_token) {
      throw new Error('Google hat kein Refresh-Token geliefert. Bitte Verbindung erneut bestaetigen.');
    }

    const profile = await getGoogleUserProfile(tokenPayload.access_token);

    await req.prisma.user.update({
      where: { id: decodedState.userId },
      data: {
        calendarProvider: 'GOOGLE',
        calendarEmail: profile.email || null,
        calendarRefreshToken: encryptCalendarRefreshToken(tokenPayload.refresh_token),
        calendarSyncEnabled: true,
        calendarConnectedAt: new Date(),
        calendarLastSyncedAt: null,
        calendarSyncError: null,
      },
    });

    const syncResult = await syncUserCalendarTasks(req.prisma, decodedState.userId);
    await writeAuditLog(req, {
      action: 'CALENDAR_CONNECTED',
      entityType: 'USER',
      entityId: decodedState.userId,
      entityLabel: profile.email || decodedState.userId,
      summary: `${profile.email || 'Ein Benutzer'} hat einen Kalender verbunden.`,
      severity: 'NOTICE',
      metadata: {
        provider: 'GOOGLE',
        syncedCount: syncResult.syncedCount,
      },
    });

    return res.redirect(
      buildFrontendCalendarRedirectUrl({
        status: 'connected',
        message: `Kalender verbunden. ${syncResult.syncedCount} Ticket-Fristen wurden synchronisiert.`,
        returnTo: decodedState.returnTo,
      }),
    );
  } catch (error) {
    return res.redirect(
      buildFrontendCalendarRedirectUrl({
        status: 'error',
        message: error.message || 'Kalender konnte nicht verbunden werden.',
      }),
    );
  }
});

router.post('/sync', auth, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.status(400).json({ message: 'Im Gastmodus ist kein Kalender-Sync verfuegbar.' });
    }

    const result = await syncUserCalendarTasks(req.prisma, req.user.id);
    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });

    await writeAuditLog(req, {
      action: 'CALENDAR_SYNC_TRIGGERED',
      entityType: 'USER',
      entityId: req.user.id,
      entityLabel: req.user.email,
      summary: `${req.user.email} hat den Kalender-Sync gestartet.`,
      severity: 'INFO',
      metadata: {
        syncedCount: result.syncedCount,
      },
    });

    res.json({
      message: `${result.syncedCount} Ticket-Fristen wurden synchronisiert.`,
      connection: serializeCalendarConnection(user),
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Kalender-Sync konnte nicht gestartet werden.' });
  }
});

router.delete('/disconnect', auth, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.status(400).json({ message: 'Im Gastmodus ist keine Kalender-Verbindung aktiv.' });
    }

    const user = await disconnectUserCalendar(req.prisma, req.user.id);
    await writeAuditLog(req, {
      action: 'CALENDAR_DISCONNECTED',
      entityType: 'USER',
      entityId: req.user.id,
      entityLabel: req.user.email,
      summary: `${req.user.email} hat die Kalender-Verbindung getrennt.`,
      severity: 'WARNING',
      metadata: {
        provider: 'GOOGLE',
      },
    });

    res.json({
      message: 'Kalender-Verbindung wurde getrennt.',
      connection: serializeCalendarConnection(user),
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Kalender-Verbindung konnte nicht getrennt werden.' });
  }
});

module.exports = router;
