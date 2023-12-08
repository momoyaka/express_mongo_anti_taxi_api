const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const config = require('../../config/config');
const bcrypt = require('bcrypt');
const User = require('../user/user.model');

// sample user, used for authentication
// const user = {
//   username: 'react',
//   password: 'express'
// };

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
async function login(req, res, next){
  // Ideally you'll fetch this from the db
  // Idea here was to show how jwt works with simplicity

  let error = false;

  let user = await User.getByPhone(req.body.phoneNumber).catch(e =>{
    error = true;
  });

  if(error) return next(new APIError('Authentication error', httpStatus.UNAUTHORIZED, true)); 
  


  if (req.body.phoneNumber === user.phoneNumber && bcrypt.compareSync(req.body.password,  user.hashPassword)) {
    const token = jwt.sign({
      id: user._id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    }, config.jwtSecret);
    return res.json({
      token,
      user: user.toJSON(),
    });
  }

  const err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true);
  return next(err);
}

/**
 * This is a protected route. Will return random number only if jwt token is provided in header.
 * @param req
 * @param res
 * @returns {*}
 */
function getRandomNumber(req, res) {
  // req.user is assigned by jwt middleware if valid token is provided
  return res.json({
    user: req.user,
    num: Math.random() * 100
  });
}

module.exports = { login, getRandomNumber };
