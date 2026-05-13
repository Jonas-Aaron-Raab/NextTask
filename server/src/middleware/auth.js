const jwt = require('jsonwebtoken');
const { getOrCreateGuestUser } = require('../utils/guestUser');

module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    const token = header.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
      return;
    } catch (error) {
      // Im Gastmodus fallen wir bei ungultigen Tokens auf den Gastbenutzer zuruck.
    }
  }

  try {
    const guestUser = await getOrCreateGuestUser(req.prisma);
    req.user = {
      id: guestUser.id,
      email: guestUser.email,
      name: guestUser.name,
      isGuest: true,
    };
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Gastmodus konnte nicht vorbereitet werden' });
  }
};
