const User = require('./user.model');
const bcrypt = require('bcrypt');

/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  User.get(id)
    .then((user) => {
      req.user = user; // eslint-disable-line no-param-reassign
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
    state: "FREE",
    role: req.body.role,

  });
  
  user.save()
    .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}

/**
 * Update existing user
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


module.exports = { load, get, create, update, list, remove, setState };
