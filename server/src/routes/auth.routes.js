const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const auth = require('../middleware/auth');
const { ensureDefaultAccessRoles, serializeRole } = require('../utils/accessRoles');
const { pickFields, summarizeChanges, writeAuditLog } = require('../utils/auditLog');
const { canSendEmails, sendNotificationTestEmail } = require('../utils/taskNotificationMailer');
const {
  buildOtpAuthUrl,
  createRecoveryCodes,
  decryptSecret,
  encryptSecret,
  generateBase32Secret,
  hashRecoveryCodes,
  verifyRecoveryCode,
  verifyTotpCode,
} = require('../utils/twoFactor');
const router = express.Router();

const TWO_FACTOR_CHALLENGE_PURPOSE = 'two_factor_login';

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      accessRoleId: user.accessRoleId,
      purpose: 'access',
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function createTwoFactorChallengeToken(user) {
  return jwt.sign(
    { purpose: TWO_FACTOR_CHALLENGE_PURPOSE, userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '5m' },
  );
}

function verifyTwoFactorChallengeToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose !== TWO_FACTOR_CHALLENGE_PURPOSE || !decoded.userId) {
    throw new Error('Ungueltiger 2FA-Token');
  }

  return decoded;
}

function toPublicUser(user, extra = {}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    notificationEmail: user.notificationEmail,
    emailNotificationsEnabled: Boolean(user.emailNotificationsEnabled),
    emailDeliveryReady: canSendEmails(),
    role: user.role,
    department: user.department,
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    createdAt: user.createdAt,
    accessRoleId: user.accessRoleId,
    accessRole: serializeRole(user.accessRole),
    ...extra,
  };
}

async function verifySecondFactor(user, code, options = {}) {
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return { valid: false };
  }

  const secret = decryptSecret(user.twoFactorSecret);
  const totpResult = verifyTotpCode(secret, code, {
    lastUsedStep: options.enforceReplay ? user.twoFactorLastUsedStep : null,
  });

  if (totpResult.valid) {
    return {
      valid: true,
      method: 'totp',
      updateData: { twoFactorLastUsedStep: totpResult.step },
    };
  }

  const recoveryResult = await verifyRecoveryCode(code, user.twoFactorRecoveryCodes);
  if (recoveryResult.valid) {
    return {
      valid: true,
      method: 'recovery',
      updateData: { twoFactorRecoveryCodes: recoveryResult.nextRecoveryCodes },
    };
  }

  return { valid: false };
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    const prisma = req.prisma;

    if (isBlank(name) || isBlank(email) || isBlank(password)) {
      return res.status(400).json({ message: 'Name, E-Mail und Passwort sind erforderlich' });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return res.status(400).json({ message: 'E-Mail existiert bereits' });
    }

    await ensureDefaultAccessRoles(prisma);
    const accessRole = await prisma.accessRole.findUnique({ where: { code: 'M-OR-IT' } });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        notificationEmail: trimmedEmail,
        emailNotificationsEnabled: false,
        password: hashedPassword,
        role: role || 'DEVELOPER',
        department: department || 'Development',
        accessRoleId: accessRole?.id || null,
      },
      include: { accessRole: true },
    });
    const token = createToken(user);

    await writeAuditLog(req, {
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: user.name,
      summary: `Benutzer ${user.name} wurde registriert.`,
      severity: 'NOTICE',
      user,
      after: pickFields(user, ['id', 'name', 'email', 'role', 'department', 'accessRoleId']),
    });

    res.status(201).json({
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const prisma = req.prisma;

    if (isBlank(email) || isBlank(password)) {
      return res.status(400).json({ message: 'E-Mail und Passwort sind erforderlich' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: { accessRole: true },
    });

    if (!user) {
      await writeAuditLog(req, {
        action: 'LOGIN_FAILED',
        entityType: 'AUTH',
        entityLabel: trimmedEmail,
        summary: `Fehlgeschlagener Login fuer ${trimmedEmail}: Benutzer nicht gefunden.`,
        severity: 'WARNING',
        actor: { actorName: trimmedEmail, actorEmail: trimmedEmail },
      });
      return res.status(400).json({ message: 'Benutzer nicht gefunden' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await writeAuditLog(req, {
        action: 'LOGIN_FAILED',
        entityType: 'AUTH',
        entityId: user.id,
        entityLabel: user.name,
        summary: `Fehlgeschlagener Login fuer ${user.email}: falsches Passwort.`,
        severity: 'WARNING',
        user,
      });
      return res.status(400).json({ message: 'Falsches Passwort' });
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const challengeToken = createTwoFactorChallengeToken(user);
      await writeAuditLog(req, {
        action: 'TWO_FACTOR_REQUIRED',
        entityType: 'AUTH',
        entityId: user.id,
        entityLabel: user.name,
        summary: `${user.name} hat das Passwort bestaetigt; 2FA ist erforderlich.`,
        severity: 'NOTICE',
        user,
      });

      return res.json({
        requiresTwoFactor: true,
        challengeToken,
        user: {
          email: user.email,
          name: user.name,
        },
      });
    }

    const token = createToken(user);
    await writeAuditLog(req, {
      action: 'LOGIN_SUCCESS',
      entityType: 'AUTH',
      entityId: user.id,
      entityLabel: user.name,
      summary: `${user.name} hat sich angemeldet.`,
      severity: 'INFO',
      user,
    });

    res.json({
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

router.post('/login/2fa', async (req, res) => {
  try {
    const { challengeToken, code } = req.body;
    const prisma = req.prisma;

    if (isBlank(challengeToken) || isBlank(code)) {
      return res.status(400).json({ message: '2FA-Code ist erforderlich' });
    }

    let challenge;
    try {
      challenge = verifyTwoFactorChallengeToken(challengeToken);
    } catch (error) {
      return res.status(401).json({ message: '2FA-Anmeldung ist abgelaufen. Bitte erneut einloggen.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: challenge.userId },
      include: { accessRole: true },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA ist fuer diesen Account nicht aktiv' });
    }

    const verification = await verifySecondFactor(user, code, { enforceReplay: true });
    if (!verification.valid) {
      await writeAuditLog(req, {
        action: 'TWO_FACTOR_LOGIN_FAILED',
        entityType: 'AUTH',
        entityId: user.id,
        entityLabel: user.name,
        summary: `Fehlgeschlagener 2FA-Login fuer ${user.email}.`,
        severity: 'WARNING',
        user,
      });

      return res.status(400).json({ message: 'Der 2FA-Code ist ungueltig' });
    }

    const authenticatedUser = await prisma.user.update({
      where: { id: user.id },
      data: verification.updateData,
      include: { accessRole: true },
    });

    if (verification.method === 'recovery') {
      await writeAuditLog(req, {
        action: 'TWO_FACTOR_RECOVERY_CODE_USED',
        entityType: 'AUTH',
        entityId: user.id,
        entityLabel: user.name,
        summary: `${user.name} hat sich mit einem Recovery-Code angemeldet.`,
        severity: 'WARNING',
        user,
      });
    }

    const token = createToken(authenticatedUser);
    await writeAuditLog(req, {
      action: 'LOGIN_SUCCESS',
      entityType: 'AUTH',
      entityId: authenticatedUser.id,
      entityLabel: authenticatedUser.name,
      summary: `${authenticatedUser.name} hat sich mit 2FA angemeldet.`,
      severity: 'INFO',
      user: authenticatedUser,
    });

    res.json({
      token,
      user: toPublicUser(authenticatedUser),
    });
  } catch (error) {
    res.status(500).json({ message: '2FA-Anmeldung konnte nicht abgeschlossen werden', error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { accessRole: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Profil wurde nicht gefunden' });
    }

    res.json({ user: toPublicUser(user, { isGuest: Boolean(req.user.isGuest) }) });
  } catch (error) {
    res.status(500).json({ message: 'Profil konnte nicht geladen werden', error: error.message });
  }
});

router.post('/me/2fa/setup', auth, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.status(400).json({ message: 'Im Gastmodus kann keine 2FA eingerichtet werden' });
    }

    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { accessRole: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Profil wurde nicht gefunden' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA ist bereits aktiv' });
    }

    const secret = generateBase32Secret();
    const encryptedSecret = encryptSecret(secret);
    const otpAuthUrl = buildOtpAuthUrl({ secret, accountName: user.email });
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 220,
    });

    await req.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorEnabled: false,
        twoFactorConfirmedAt: null,
        twoFactorLastUsedStep: null,
        twoFactorRecoveryCodes: [],
      },
    });

    await writeAuditLog(req, {
      action: 'TWO_FACTOR_SETUP_STARTED',
      entityType: 'AUTH',
      entityId: user.id,
      entityLabel: user.name,
      summary: `${user.name} hat die 2FA-Einrichtung gestartet.`,
      severity: 'NOTICE',
      user,
    });

    res.json({
      otpAuthUrl,
      qrCodeDataUrl,
      secret,
    });
  } catch (error) {
    res.status(500).json({ message: '2FA-Einrichtung konnte nicht gestartet werden', error: error.message });
  }
});

router.post('/me/2fa/confirm', auth, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.status(400).json({ message: 'Im Gastmodus kann keine 2FA eingerichtet werden' });
    }

    const { code } = req.body;
    if (isBlank(code)) {
      return res.status(400).json({ message: '2FA-Code ist erforderlich' });
    }

    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { accessRole: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Profil wurde nicht gefunden' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA ist bereits aktiv' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: 'Starte zuerst die 2FA-Einrichtung' });
    }

    const secret = decryptSecret(user.twoFactorSecret);
    const verification = verifyTotpCode(secret, code);
    if (!verification.valid) {
      await writeAuditLog(req, {
        action: 'TWO_FACTOR_SETUP_FAILED',
        entityType: 'AUTH',
        entityId: user.id,
        entityLabel: user.name,
        summary: `${user.name} konnte die 2FA-Einrichtung nicht bestaetigen.`,
        severity: 'WARNING',
        user,
      });

      return res.status(400).json({ message: 'Der 2FA-Code ist ungueltig' });
    }

    const recoveryCodes = createRecoveryCodes();
    const hashedRecoveryCodes = await hashRecoveryCodes(recoveryCodes);
    const updatedUser = await req.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorConfirmedAt: new Date(),
        twoFactorLastUsedStep: verification.step,
        twoFactorRecoveryCodes: hashedRecoveryCodes,
      },
      include: { accessRole: true },
    });

    await writeAuditLog(req, {
      action: 'TWO_FACTOR_ENABLED',
      entityType: 'AUTH',
      entityId: updatedUser.id,
      entityLabel: updatedUser.name,
      summary: `${updatedUser.name} hat 2FA aktiviert.`,
      severity: 'WARNING',
      user: updatedUser,
    });

    res.json({
      user: toPublicUser(updatedUser, { isGuest: Boolean(req.user.isGuest) }),
      recoveryCodes,
      message: '2FA wurde aktiviert.',
    });
  } catch (error) {
    res.status(500).json({ message: '2FA konnte nicht aktiviert werden', error: error.message });
  }
});

router.post('/me/2fa/disable', auth, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.status(400).json({ message: 'Im Gastmodus kann keine 2FA geaendert werden' });
    }

    const { password, code } = req.body;
    if (isBlank(password) || isBlank(code)) {
      return res.status(400).json({ message: 'Passwort und 2FA-Code sind erforderlich' });
    }

    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { accessRole: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Profil wurde nicht gefunden' });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA ist nicht aktiv' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(400).json({ message: 'Das aktuelle Passwort ist nicht korrekt' });
    }

    const verification = await verifySecondFactor(user, code);
    if (!verification.valid) {
      await writeAuditLog(req, {
        action: 'TWO_FACTOR_DISABLE_FAILED',
        entityType: 'AUTH',
        entityId: user.id,
        entityLabel: user.name,
        summary: `${user.name} konnte 2FA nicht deaktivieren.`,
        severity: 'WARNING',
        user,
      });

      return res.status(400).json({ message: 'Der 2FA-Code ist ungueltig' });
    }

    const updatedUser = await req.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorConfirmedAt: null,
        twoFactorLastUsedStep: null,
        twoFactorRecoveryCodes: [],
      },
      include: { accessRole: true },
    });

    await writeAuditLog(req, {
      action: 'TWO_FACTOR_DISABLED',
      entityType: 'AUTH',
      entityId: updatedUser.id,
      entityLabel: updatedUser.name,
      summary: `${updatedUser.name} hat 2FA deaktiviert.`,
      severity: 'WARNING',
      user: updatedUser,
    });

    res.json({
      user: toPublicUser(updatedUser, { isGuest: Boolean(req.user.isGuest) }),
      message: '2FA wurde deaktiviert.',
    });
  } catch (error) {
    res.status(500).json({ message: '2FA konnte nicht deaktiviert werden', error: error.message });
  }
});

router.put('/me', auth, async (req, res) => {
  try {
    const { name, email, department, notificationEmail, emailNotificationsEnabled } = req.body;

    if (isBlank(name) || isBlank(department)) {
      return res.status(400).json({ message: 'Name und Abteilung sind erforderlich' });
    }

    const currentUser = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!currentUser) {
      return res.status(404).json({ message: 'Profil wurde nicht gefunden' });
    }

    const nextEmail = req.user.isGuest ? currentUser.email : String(email || '').trim().toLowerCase();
    if (!req.user.isGuest && isBlank(nextEmail)) {
      return res.status(400).json({ message: 'E-Mail ist erforderlich' });
    }

    if (!req.user.isGuest && nextEmail !== currentUser.email) {
      const existing = await req.prisma.user.findUnique({ where: { email: nextEmail } });
      if (existing) {
        return res.status(400).json({ message: 'Diese E-Mail wird bereits verwendet' });
      }
    }

    const nextNotificationEmail = req.user.isGuest
      ? currentUser.notificationEmail || currentUser.email
      : String(notificationEmail || '').trim().toLowerCase();
    const notificationsEnabled = req.user.isGuest ? false : Boolean(emailNotificationsEnabled);

    if (notificationsEnabled && isBlank(nextNotificationEmail) && isBlank(nextEmail)) {
      return res.status(400).json({ message: 'Bitte hinterlege eine E-Mail fuer Benachrichtigungen.' });
    }

    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name.trim(),
        email: nextEmail,
        notificationEmail: nextNotificationEmail || null,
        emailNotificationsEnabled: notificationsEnabled,
        role: currentUser.role,
        department: department.trim(),
      },
      include: { accessRole: true },
    });
    const token = req.user.isGuest ? null : createToken(user);

    await writeAuditLog(req, {
      action: 'PROFILE_UPDATED',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: user.name,
      summary: `${user.name} hat Profildaten geaendert.`,
      severity: 'NOTICE',
      before: summarizeChanges(
        pickFields(currentUser, ['name', 'email', 'notificationEmail', 'emailNotificationsEnabled', 'department']),
        pickFields(user, ['name', 'email', 'notificationEmail', 'emailNotificationsEnabled', 'department']),
      ),
      after: pickFields(user, ['name', 'email', 'notificationEmail', 'emailNotificationsEnabled', 'department']),
    });

    res.json({ token, user: toPublicUser(user, { isGuest: Boolean(req.user.isGuest) }) });
  } catch (error) {
    res.status(500).json({ message: 'Profil konnte nicht gespeichert werden', error: error.message });
  }
});

router.put('/me/password', auth, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.status(400).json({ message: 'Im Gastmodus kann kein Passwort geaendert werden' });
    }

    const { currentPassword, newPassword } = req.body;
    if (isBlank(currentPassword) || isBlank(newPassword)) {
      return res.status(400).json({ message: 'Aktuelles und neues Passwort sind erforderlich' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Das neue Passwort muss mindestens 8 Zeichen lang sein' });
    }

    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: 'Profil wurde nicht gefunden' });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatches) {
      return res.status(400).json({ message: 'Das aktuelle Passwort ist nicht korrekt' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await req.prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    await writeAuditLog(req, {
      action: 'PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: user.name,
      summary: `${user.name} hat das Passwort geaendert.`,
      severity: 'WARNING',
    });

    res.json({ message: 'Passwort wurde geaendert' });
  } catch (error) {
    res.status(500).json({ message: 'Passwort konnte nicht geaendert werden', error: error.message });
  }
});

router.post('/me/notifications/test', auth, async (req, res) => {
  try {
    if (req.user.isGuest) {
      return res.status(400).json({ message: 'Im Gastmodus ist keine Testmail verfuegbar.' });
    }

    if (!canSendEmails()) {
      return res.status(400).json({ message: 'Der E-Mail-Versand ist auf dem Server noch nicht aktiviert.' });
    }

    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { accessRole: true },
    });
    if (!user) {
      return res.status(404).json({ message: 'Profil wurde nicht gefunden' });
    }

    if (!user.emailNotificationsEnabled) {
      return res.status(400).json({ message: 'Aktiviere zuerst deine E-Mail-Benachrichtigungen.' });
    }

    await sendNotificationTestEmail({ recipient: user });
    res.json({ message: 'Testmail wurde versendet.' });
  } catch (error) {
    res.status(500).json({ message: 'Testmail konnte nicht versendet werden', error: error.message });
  }
});

module.exports = router;
