const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
router.get('/', auth, async (req, res) => {
  try {
    const projects = await req.prisma.project.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Laden der Projekte',
      error: error.message,
    });
  }
});
router.post('/', auth, async (req, res) => {
  try {
    const { name, key, description } = req.body;
    const project = await req.prisma.project.create({
      data: {
        name,
        key,
        description,
        ownerId: req.user.id,
      },
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Erstellen des Projekts',
      error: error.message,
    });
  }
});
module.exports = router;
