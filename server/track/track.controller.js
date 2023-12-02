const Track = require('./track.model')
const User = require('../user/user.model');
const APIError = require('../helpers/APIError');
const httpStatus = require('http-status');
const { UserRole, UserState } = require('../helpers/Enums');
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
 * Get track
 * @returns {Track}
 */
function getByUser(req, res) {
  Track.getActiveByUser(req.user.id)
  .then( track => res.json(track))
  .catch( e => next(e) )
}

/**
 * Create new track
 * @returns {Track}
 * 
 */
async function create(req, res, next) {

  const driver = await User.get(req.owner.id).catch(e => next(e));

  if (driver.role !== UserRole.DRIVER) return next(new APIError("User is not driver", httpStatus.METHOD_NOT_ALLOWED));
  if (driver.car === undefined) return next(new APIError("Driver needs a car", httpStatus.METHOD_NOT_ALLOWED));
  if (driver.state !== UserState.FREE) return next(new APIError("Driver busy", httpStatus.METHOD_NOT_ALLOWED));

  const {startLocation, endLocation, departureTime, driverComment, maxSeats } = req.body;


  const newTrack = new Track({
    driver: driver._id,
    startLocation: {
      coordinates: startLocation.coordinates,
      address: startLocation.address
    },
    endLocation: {
      coordinates: endLocation.coordinates,
      address: endLocation.address
    },
    driverComment: driverComment,
    maxSeats: maxSeats,
    departureTime:departureTime
  });



  const savedTrack = await newTrack.save().catch(e => next(e));

  driver.state = UserState.ON_TRACK_WAITING;
  const savedDriver = await driver.save().catch(e => next(e));

  return res.json({
    newDriverState:savedDriver.state,
    track: savedTrack,
  })
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

async function depart(req, res, next) {
  const userId = req.user.id;
  const trackId = req.params.trackId;

  if( !(await Track.isUserDriverOfTrack(userId, trackId)) ) next(new APIError('user is not driver of this track', httpStatus.METHOD_NOT_ALLOWED));

  const track = Track.get(trackId);

  if(track.passenger === undefined) next(new APIError('can`t depart without passenger', httpStatus.METHOD_NOT_ALLOWED));

  track.state = 'Active';

  const driver = await User.get(track.driver);
  const passenger = await User.get(track.passenger);

  driver.state = UserState.ON_TRACK;
  passenger.state = UserState.ON_TRACK;

  const sD = await driver.save().catch(e => next(e));
  const sP = await passenger.save().catch(e => next(e));
 
  const sT = await track.save()

  res.json({
    newDriverState:sD.state,
    newpassengerState:sP.state,
    track:sT,
  })
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

async function addpassenger(req, res, next){

  if(req.user.role !== UserRole.PASSENGER) next(new APIError("user is not passenger", httpStatus.METHOD_NOT_ALLOWED));

  const passenger = await User.get(req.user.id).catch(e => next(e));

  
}

module.exports = { load, get, create, update, list, remove, getByUser, depart, addpassenger };
