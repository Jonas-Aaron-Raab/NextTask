const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
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
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
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
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});
module.exports = router;
