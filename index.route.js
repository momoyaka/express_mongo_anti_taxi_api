const express = require('express');
const userRoutes = require('./server/user/user.route');
const authRoutes = require('./server/auth/auth.route');
const trackRoutes = require('./server/track/track.route');
const { AcceptedRoles, UserStates, TrackStates } = require('./server/helpers/Enums');

const router = express.Router(); // eslint-disable-line new-cap

// TODO: use glob to match *.route files

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

router.get('/enums', (req, res) =>
  res.json({
    userRoles: AcceptedRoles,
    userStates: UserStates,
    trackStates:TrackStates
  })
);
// mount user routes at /users
router.use('/users', userRoutes);

// mount auth routes at /auth
router.use('/auth', authRoutes);

router.use('/tracks', trackRoutes);

module.exports = router;
