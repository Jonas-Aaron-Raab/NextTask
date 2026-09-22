const express = require('express');
const auth = require('../middleware/auth');
const { serializeDocument } = require('../utils/contentSerializers');
const { buildDocumentScopeWhere, getCurrentUserWithAccessRole } = require('../utils/accessScope');

const router = express.Router();

const documentInclude = {
  department: true,
  project: true,
  linkedTasks: { orderBy: { createdAt: 'asc' } },
  controls: { orderBy: { controlId: 'asc' } },
  auditEntries: { orderBy: { order: 'asc' } },
};

router.get('/', auth, async (req, res) => {
  try {
    const currentUser = await getCurrentUserWithAccessRole(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });

    const [documents, templates] = await Promise.all([
      req.prisma.document.findMany({
        where: buildDocumentScopeWhere(currentUser),
        include: documentInclude,
        orderBy: [{ updatedAt: 'desc' }, { title: 'asc' }],
      }),
      req.prisma.documentTemplate.findMany({ orderBy: { title: 'asc' } }),
    ]);

    res.json({
      documents: documents.map(serializeDocument),
      templates: templates.map((template) => ({
        id: template.id,
        title: template.title,
        description: template.description || '',
        type: template.type,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Dokumente konnten nicht geladen werden', error: error.message });
  }
});

module.exports = router;
