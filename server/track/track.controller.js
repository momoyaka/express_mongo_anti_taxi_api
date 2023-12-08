const Track = require('./track.model')
const User = require('../user/user.model');
const APIError = require('../helpers/APIError');
const httpStatus = require('http-status');
const { UserRole, UserState, TrackState } = require('../helpers/Enums');
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

  const track = req.track;

  if( track.driver !=  req.owner.id ) return next(new APIError('user is not driver of this track', httpStatus.METHOD_NOT_ALLOWED));

  if(track.passenger === undefined) return next(new APIError('can`t depart without passenger', httpStatus.METHOD_NOT_ALLOWED));
  if(track.state !== TrackState.WAITING_DEPARTURE) return next(new APIError(`can't depart from state ${track.state}`, httpStatus.METHOD_NOT_ALLOWED));

  track.state = TrackState.ACTIVE;

  const driver = await User.get(track.driver);
  const passenger = await User.get(track.passenger);

  driver.state = UserState.ON_TRACK;
  passenger.state = UserState.ON_TRACK;

  const sD = await driver.save().catch(e => next(e));
  const sP = await passenger.save().catch(e => next(e));
 
  
  const sT = await track.save().catch(e => next(e));

  res.json({
    newDriverState:sD.state,
    newPassengerState:sP.state,
    track:sT,
  })
}

async function finish(req, res, next) {

  const track = req.track;

  if( track.driver !=  req.owner.id && track.passenger !=  req.owner.id ) return  next(new APIError('user is not participant of this track', httpStatus.METHOD_NOT_ALLOWED));
  if( track.state !== TrackState.ACTIVE) return next(new APIError(`can't finish from state ${track.state}`, httpStatus.METHOD_NOT_ALLOWED));

  track.state = TrackState.FINISHED;

  const driver = await User.get(track.driver);
  const passenger = await User.get(track.passenger);

  driver.state = UserState.FREE;
  passenger.state = UserState.FREE;

  const sD = await driver.save().catch(e => next(e));
  const sP = await passenger.save().catch(e => next(e));
 
  const sT = await track.save().catch(e => next(e));

  res.json({
    newDriverState:sD.state,
    newpassengerState:sP.state,
    track:sT,
  })
}





/**
 * Get track list.
 * @property {number} req.query.page - Number of users to be skipped.
 * @property {number} req.query.ipp - Limit number of users to be returned.
 * @returns {Track[]}
 */
function nearestList(req, res, next) {

  const {ipp,page, sX,sY, eX,eY} = req.query;

  const limit = ipp;
  const  skip = page*ipp 
  Track.nearestList({ limit, skip, sX, sY, eX, eY })
    .then(async tracks => {

      const totalCount = await Track.count({ state: TrackState.WAITING_PASSENGER }).exec();

      const isMore = totalCount > skip + tracks.length;

      res.json({
        totalCount:totalCount,
        isMore: isMore,
        tracks: tracks
      })
    })
    .catch(e => next(e));
}

/**
 * Delete track.
 * @returns {Track}
 */
async function remove(req, res, next) {
  const track = req.track;

  if(req.owner.id != track.driver) return next(new APIError("user is not driver", httpStatus.METHOD_NOT_ALLOWED));
  const driver = await User.get(req.owner.id).catch(e => next(e));
  const passenger = await User.get(track.passenger).catch(e => next(e));

  driver.state = UserState.FREE;
  if(passenger !== undefined) passenger.state =UserState.FREE;

  track.deleteOne()
    .then( async (deletedTrack) => {

      const sD = await driver.save().catch(e => next(e));

      
      if(passenger !== undefined) {const sP = await passenger.save().catch(e => next(e));

        return res.json({
          newDriverState: sD.state,
          newPassengerState: sP.state,
          track: deletedTrack,
        })
      }
      return res.json({
        newDriverState: sD.state,
        track: deletedTrack,
      })
    })
    .catch(e => next(e));
}

async function addPassenger(req, res, next){

  const track = req.track;

  if(track.passenger !== undefined) return next(new APIError("track has passenger", httpStatus.METHOD_NOT_ALLOWED));
  if(req.owner.role !== UserRole.PASSENGER) return next(new APIError("user is not passenger", httpStatus.METHOD_NOT_ALLOWED));

  const passenger = await User.get(req.owner.id).catch(e => next(e));
  if(passenger.state !== UserState.FREE) return next(new APIError("user already on track", httpStatus.METHOD_NOT_ALLOWED));


  track.passenger = passenger._id;
  track.state = TrackState.WAITING_DEPARTURE;
  passenger.state = UserState.ON_TRACK_WAITING;

  track.save()
  .then(async (saved) => {
    const savedP = await passenger.save().catch(e => next(e));
 
    res.json(
    {
      newPassengerState: savedP.state,
      track:saved
    }
  )})
  .catch(e => next(e));
}

async function removePassenger(req, res, next){

  const track = req.track;

  if(track.state !== TrackState.WAITING_DEPARTURE) return next(new APIError(`can't remove passanger from state ${track.state}`, httpStatus.METHOD_NOT_ALLOWED));
  if(req.owner.role !== UserRole.PASSENGER) return next(new APIError("user is not passenger", httpStatus.METHOD_NOT_ALLOWED));
  if(req.owner.id != track.passenger) return next(new APIError("wrong passenger", httpStatus.METHOD_NOT_ALLOWED));

  const passenger = await User.get(req.owner.id).catch(e => next(e));

  track.passenger = undefined;
  track.state = TrackState.WAITING_PASSENGER;
  track.passengerComment = "";
  passenger.state = UserState.FREE;

  const savedP = await passenger.save().catch(e => next(e));
  track.save()
  .then(saved=>res.json(
    {
      newPassengerState: savedP.state,
      track:saved
    }
  ))
  .catch(e => next(e));
}

async function comment(req, res, next){

  const track = req.track;

  const isPassenger = req.owner.id == track.passenger;
  const isDriver = req.owner.id == track.driver;

  if( !isPassenger && !isDriver ) return next(new APIError("user is not participating", httpStatus.METHOD_NOT_ALLOWED));

  const comment = req.body.comment;

  if(isPassenger) {
    track.passengerComment = comment;
  }
  if(isDriver) {
    track.driverComment = comment;
  }

  track.save()
  .then(saved=>res.json(saved))
  .catch(e => next(e));
}

module.exports = { load, get, create, update, nearestList, remove, getByUser, depart, finish, addPassenger , removePassenger, comment};
