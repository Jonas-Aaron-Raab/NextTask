const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { ensureDefaultAccessRoles, serializeRole } = require('../utils/accessRoles');
const { pickFields, summarizeChanges, writeAuditLog } = require('../utils/auditLog');
const { canSendEmails, sendNotificationTestEmail } = require('../utils/taskNotificationMailer');
const router = express.Router();

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department, accessRoleId: user.accessRoleId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
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
    createdAt: user.createdAt,
    accessRoleId: user.accessRoleId,
    accessRole: serializeRole(user.accessRole),
    ...extra,
  };
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
