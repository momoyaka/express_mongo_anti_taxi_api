const User = require('./user.model');
const Track = require('../track/track.model');
const Car = require('../models/car.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const { UserState } = require('../helpers/Enums');
const APIError = require('../helpers/APIError');

const httpStatus = require('http-status');
/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  User.get(id)
    .then((user) => {
      req.user = user;
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get user
 * @returns {User}
 */
function get(req, res) {
  return res.json(req.user);
}

/**
 * Create new user
 * @property {string} req.body.phoneNumber
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.password - The unhashed password of user.
 * @property {string} req.body.role - user role
 * @returns {User}
 * 
 */
function create(req, res, next) {

  const salt = bcrypt.genSaltSync(1);

  const hashPassword = bcrypt.hashSync(req.body.password, salt)

  const user = new User({
    phoneNumber:req.body.phoneNumber,
    username: req.body.username,
    hashPassword: hashPassword,
    state: UserState.FREE,
    role: req.body.role,

  });
  
  user.save()
    .then(savedUser => {
      const token = jwt.sign({
        id: savedUser._id,
        phoneNumber: savedUser.phoneNumber,
        role: savedUser.role,
      }, config.jwtSecret);

      res.json({
        token,
        user: savedUser.toJSON(),
      });
    })
    .catch(e => next(e));
}

/**
 * Update existing user
 * @property {string} req.body.username - The username of user.
 * @returns {User}
 */
function update(req, res, next) {
  const user = req.user;

  const owner = req.owner

  if(user._id != owner.id) return next(new APIError("Only owner can edit", httpStatus.METHOD_NOT_ALLOWED))

  if(req.body.username)
    user.username = req.body.username;
  if(req.body.role)
    user.role = req.body.role;

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
  const user = req.user;
  user.state = req.body.newState;

  user.save()
    .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}

/**
 * Get user list.
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


/**
 * get user car.
 * @returns {Car}
 */
async function getCar(req, res, next) {
  if(req.user.car === undefined) return next(new APIError('User has not car', httpStatus.NOT_FOUND));
  return res.json(req.user.car);
}

/**
 * update driver car.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 */
function updateCar(req, res, next) {

  const user = req.user;

  const {model, color, regNumber} = req.body;

  const newCar = new Car({
    model:model,
    color:color,
    regNumber:regNumber,
  });

  user.car = newCar;

  user.save()
    .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}


function getActiveTrack(req, res, next){
  Track.getActiveByUser(req.owner.id)
  .then(track => res.json(track))
  .catch(e => next(e));
}


module.exports = { load, get, create, update, list, remove, setState, getCar, updateCar, getActiveTrack};
