const Joi = require('joi');
const { UserStates, AcceptedRoles } = require('../server/helpers/Enums');

const phoneRegex = /^\d{10}$/;

module.exports = {
  // POST /api/users
  createUser: {
    body: {
      phoneNumber: Joi.string().regex(phoneRegex).required(),
      username: Joi.string().required(),
      password: Joi.string().min(8).required(),
      role:     Joi.string().valid(...AcceptedRoles).required(),
    }
  },

  // UPDATE /api/users/:userId
  updateUser: {
    body: {
      username: Joi.string().required(),
      mobileNumber: Joi.string().required()
    },
    params: {
      userId: Joi.string().hex().required()
    }
  },

  setUserState: {
    body: {
      newState:Joi.string().valid(...UserStates).required(),
    },
    params: {
      userId: Joi.string().hex().required()
    }
  },

  // POST /api/auth/login
  login: {
    body: {
      phoneNumber: Joi.string().regex(phoneRegex).required(),
      password: Joi.string().required()
    }
  },


  createTrack:{

    body:{
      maxSeats: Joi.number().integer().positive().required(),
      driverComment:Joi.string().max(1000),
      startLocation: Joi.object({
        coordinates: Joi.array().items(Joi.number()).max(2).required(),
        address: Joi.string()
      }).required(),
      endLocation: Joi.object({
        coordinates: Joi.array().items(Joi.number()).max(2).required(),
        address: Joi.string()
      }).required(),
      departureTime: Joi.date().iso().required()
        .max(new Date(new Date().getTime() + 48 * 60 * 60 * 1000)) // Maximum 48 hours from now
    }
  },

  getByUser:{
    params:{
      userId:Joi.string().hex().required(),
    }
  }
};
