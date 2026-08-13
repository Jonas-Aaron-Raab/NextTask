const GUEST_EMAIL = 'gast@nexttask.local';
const GUEST_NAME = 'Gast';
const GUEST_PASSWORD = 'guest-mode-disabled';

async function getOrCreateGuestUser(prisma) {
  const adminRole = await prisma.accessRole.findUnique({ where: { code: 'A' } }).catch(() => null);
  const existingGuest = await prisma.user.findUnique({
    where: { email: GUEST_EMAIL },
  });

  if (existingGuest) {
    if (adminRole && existingGuest.accessRoleId !== adminRole.id) {
      return prisma.user.update({
        where: { id: existingGuest.id },
        data: { accessRoleId: adminRole.id, role: 'ADMIN' },
      });
    }

    return existingGuest;
  }

  return prisma.user.create({
    data: {
      name: GUEST_NAME,
      email: GUEST_EMAIL,
      password: GUEST_PASSWORD,
      role: adminRole ? 'ADMIN' : 'DEVELOPER',
      accessRoleId: adminRole?.id || null,
    },
  });
}

module.exports = {
  getOrCreateGuestUser,
  GUEST_EMAIL,
  GUEST_NAME,
};