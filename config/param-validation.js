const Joi = require('joi');
const { UserStates, AcceptedRoles } = require('../server/helpers/Enums');

const phoneRegex = /^\d{10}$/;

module.exports = {

  list: {
    query:{
      ipp: Joi.number().integer().positive(),
      page: Joi.number().integer().min(0)
    }
  },

  trackList: {
    query:{
      sX:Joi.number().required(),
      sY:Joi.number().required(),
      eX:Joi.number().required(),
      eY:Joi.number().required(),
    }
  },

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
      username: Joi.string(),
      role: Joi.string().valid(...AcceptedRoles),
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
        .min(new Date(new Date().getTime()))
        .max(new Date(new Date().getTime() + 48 * 60 * 60 * 1000)) // Maximum 48 hours from now
    }
  },

  updateTrack:{
    params:{
      trackId:Joi.string().hex().required(),
    },
    body:{
    }
  },

  getByUser:{
    params:{
      userId:Joi.string().hex().required(),
    }
  },

  updateCar:{
    params:{
      userId:Joi.string().hex().required(),
    },
    body:{
      model: Joi.string().required(),
      color: Joi.string().required(),
      regNumber: Joi.string().required(),
    }

  },
  trackComment:{
    comment:Joi.string().max(1000).required(),
  },
};
