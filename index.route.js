const express = require('express');
const userRoutes = require('./server/user/user.route');
const authRoutes = require('./server/auth/auth.route');
const trackRoutes = require('./server/track/track.route');
const { AcceptedRoles, UserStates, TrackStates } = require('./server/helpers/Enums');
const { route } = require('./config/express');
const config = require('./config/config');
const APIError = require('./server/helpers/APIError');
const httpStatus = require('http-status');

const router = express.Router(); // eslint-disable-line new-cap

router.use(( req, res, next )=>{
  if(req.headers['x-api-key'] !== config.apiKey) return next(new APIError('no api key provided', httpStatus.UNAUTHORIZED));
  next();
})

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
