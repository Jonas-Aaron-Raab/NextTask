const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const router = express.Router();

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  department: true,
  createdAt: true,
};

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function toPublicUser(user, extra = {}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    createdAt: user.createdAt,
    ...extra,
  };
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    const prisma = req.prisma;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (isBlank(name) || isBlank(email) || isBlank(password)) {
      return res.status(400).json({ message: 'Name, E-Mail und Passwort sind erforderlich' });
    }

    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return res.status(400).json({ message: 'E-Mail existiert bereits' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        password: hashedPassword,
        role: role || 'DEVELOPER',
        department: department || 'Development',
      },
    });
    const token = createToken(user);
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
    const trimmedEmail = email.trim();

    if (isBlank(email) || isBlank(password)) {
      return res.status(400).json({ message: 'E-Mail und Passwort sind erforderlich' });
    }

    const user = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (!user) {
      return res.status(400).json({ message: 'Benutzer nicht gefunden' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Falsches Passwort' });
    }
    const token = createToken(user);
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
      select: userSelect,
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
    const { name, email, department } = req.body;

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

    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name.trim(),
        email: nextEmail,
        role: currentUser.role,
        department: department.trim(),
      },
      select: userSelect,
    });
    const token = req.user.isGuest ? null : createToken(user);

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

    res.json({ message: 'Passwort wurde geaendert' });
  } catch (error) {
    res.status(500).json({ message: 'Passwort konnte nicht geaendert werden', error: error.message });
  }
});
module.exports = router;
