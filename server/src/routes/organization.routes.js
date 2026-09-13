const express = require('express');
const auth = require('../middleware/auth');
const { serializeDepartment, serializeProject, serializeTask } = require('../utils/contentSerializers');

const router = express.Router();

const projectInclude = {
  owner: { select: { id: true, name: true, email: true, department: true } },
  department: true,
  milestones: { orderBy: { order: 'asc' } },
  risks: { orderBy: { createdAt: 'asc' } },
  budgetLines: { orderBy: { order: 'asc' } },
  interfaces: { orderBy: { order: 'asc' } },
  approvals: true,
  statusReports: { orderBy: { reportDate: 'desc' } },
  tasks: {
    orderBy: [{ status: 'asc' }, { order: 'asc' }],
    include: {
      assignee: { select: { id: true, name: true, email: true, role: true, department: true } },
      assignmentSource: true,
      compliance: true,
      attachments: { orderBy: { createdAt: 'asc' } },
      auditEntries: { orderBy: { order: 'asc' } },
      personLinks: { orderBy: { createdAt: 'asc' } },
      tags: { orderBy: { label: 'asc' } },
      comments: {
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  },
};

router.get('/', auth, async (req, res) => {
  try {
    const [departments, projects] = await Promise.all([
      req.prisma.department.findMany({
        include: {
          members: { orderBy: { order: 'asc' } },
        },
        orderBy: [{ businessArea: 'asc' }, { name: 'asc' }],
      }),
      req.prisma.project.findMany({
        include: projectInclude,
        orderBy: [{ createdAt: 'asc' }],
      }),
    ]);

    const tasks = projects.flatMap((project) =>
      project.tasks.map((task) =>
        serializeTask({
          ...task,
          project: {
            id: project.id,
            name: project.name,
            key: project.key,
            color: project.color,
            deadline: project.deadline,
          },
        }),
      ),
    );

    res.json({
      departments: departments.map(serializeDepartment),
      projects: projects.map((project) => serializeProject({ ...project, tasks: undefined })),
      tasks,
    });
  } catch (error) {
    res.status(500).json({ message: 'Organisationsdaten konnten nicht geladen werden', error: error.message });
  }
});

router.get('/departments', auth, async (req, res) => {
  try {
    const departments = await req.prisma.department.findMany({
      include: { members: { orderBy: { order: 'asc' } } },
      orderBy: [{ businessArea: 'asc' }, { name: 'asc' }],
    });

    res.json(departments.map(serializeDepartment));
  } catch (error) {
    res.status(500).json({ message: 'Abteilungen konnten nicht geladen werden', error: error.message });
  }
});

router.post('/departments', auth, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Abteilungsname ist erforderlich' });

    const leadName = String(req.body.lead || req.body.leadName || req.user.name || 'NextTask').trim();
    const department = await req.prisma.department.create({
      data: {
        name,
        code: req.body.code ? String(req.body.code).trim().toUpperCase() : null,
        businessArea: req.body.businessArea ? String(req.body.businessArea).trim().toUpperCase() : null,
        leadName,
        leadId: req.user.id || null,
        memberCount: Number.parseInt(req.body.memberCount, 10) || 1,
        description: String(req.body.description || 'Neue Abteilung fuer strukturierte Projekte und Zusammenarbeit.').trim(),
        accent: req.body.accent || 'border-slate-300 bg-[#fff4f6]',
        badgeTone: req.body.badgeTone || 'bg-[#fff0f2] text-[#b84758]',
        members: {
          create: {
            name: leadName,
            userId: req.user.id || null,
            order: 0,
          },
        },
      },
      include: { members: { orderBy: { order: 'asc' } } },
    });

    res.status(201).json(serializeDepartment(department));
  } catch (error) {
    res.status(500).json({ message: 'Abteilung konnte nicht erstellt werden', error: error.message });
  }
});

module.exports = router;
