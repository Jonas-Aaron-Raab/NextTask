const GUEST_EMAIL = 'gast@nexttask.local';
const GUEST_NAME = 'Gast';
const GUEST_PASSWORD = 'guest-mode-disabled';

async function getOrCreateGuestUser(prisma) {
  const existingGuest = await prisma.user.findUnique({
    where: { email: GUEST_EMAIL },
  });

  if (existingGuest) {
    return existingGuest;
  }

  return prisma.user.create({
    data: {
      name: GUEST_NAME,
      email: GUEST_EMAIL,
      password: GUEST_PASSWORD,
    },
  });
}

module.exports = {
  getOrCreateGuestUser,
  GUEST_EMAIL,
  GUEST_NAME,
};
