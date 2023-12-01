const Track = require('./track.model')
const User = require('../user/user.model');
const APIError = require('../helpers/APIError');
const httpStatus = require('http-status');
/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  Track.get(id)
    .then((track) => {
      req.track = track; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get track
 * @returns {Track}
 */
function get(req, res) {
  return res.json(req.track);
}

/**
 * Create new track
 * @returns {Track}
 * 
 */
function create(req, res, next) {

  const driver = User.findById(req.user.id).catch(e => next(e));

  if (driver.role !== "ROLE_DRIVER") next(new APIError("User is not driver", httpStatus.METHOD_NOT_ALLOWED));

  const {startLocation, endLocation, departureTime, driverComment, maxSeats } = req.body;


  const newTrack = new Track({
    driver: driver._id,
    startLocation: startLocation,
    endLocation: endLocation,
    driverComment: driverComment,
    maxSeats: maxSeats,
    departureTime:departureTime
  });

  newTrack.save()
  .then(newTrack => res.json(newTrack))
  .catch(e => next(e));

}

/**
 * Update existing track
 * @property {string} req.body.username - The username of user.
 * @returns {User}
 */
function update(req, res, next) {
  const user = req.user;
  user.username = req.body.username;

  user.save()
    .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}

/**
 * Update existing user
 * @property {string} req.body.phoneNumber
 * @returns {User}
 */
async function setState(req, res, next) {
  let user = req.user;
  user = await User.getByPhone(user.phoneNumber);
  user.state = req.body.newState;

  user.save()
    .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}

/**
 * Get track list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {User[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  User.list({ limit, skip })
    .then(users => res.json(users))
    .catch(e => next(e));
}

/**
 * Delete user.
 * @returns {User}
 */
function remove(req, res, next) {
  const user = req.user;
  user.remove()
    .then(deletedUser => res.json(deletedUser))
    .catch(e => next(e));
}

module.exports = { load, get, create, update, list, remove, setState };
