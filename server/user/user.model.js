const Promise = require('bluebird');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const {AcceptedRoles,UserStates, UserState} = require('../helpers/Enums');
const { rename } = require('joi/lib/types/object');

const Car = require('../models/car.model');

const phoneRegex = /^\d{10}$/;


/**
 * User Schema
 */
const UserSchema = new mongoose.Schema({
  phoneNumber:{
    type:String,
    required:true,
    index: true,
    unique: true,
    match: [phoneRegex, 'The value of path {PATH} ({VALUE}) is not a valid mobile number.']
  },
  username: {
    type: String,
    required: true,
  },
  hashPassword: {
    type: String,
    required: true,
  },
  role:{
    type: String,
    required: true,
    enum: {
      values : AcceptedRoles,
      message : 'Invalid role.',
    },
  },
  state:{
    type: String,
    require:true,
    enum: {
      values : UserStates,
      message : 'Invalid state.',
    },
    default: UserState.FREE,
  },
  car: {
    type: Car.schema,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

UserSchema.plugin(uniqueValidator);

// UserSchema.pre('save', async function (next) {
//   // if (this.role === 'ROLE_DRIVER') {
//   //   if (this.car === undefined) {
//   //     return next(new APIError('A driver must have car.'));
//   //   }
//   // }
//   // next();
// });



/**
 * Methods
 */
UserSchema.method({


});


UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    // Exclude the '_id' and '__v' fields from the JSON output
    ret.id = ret._id
    delete ret._id;
    delete ret.hashPassword;
    delete ret.__v;
  },
});


/**
 * Statics
 */
UserSchema.statics = {
  /**
   * Get user
   * @param {String} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

   getByPhone(phoneNumber) {
    return this.findOne({ phoneNumber: phoneNumber })
     .exec()
     .then((user)=>{
       if (user) {
         return user;
       }
       const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
       return Promise.reject(err);
     });
 },

  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list({ skip = 0, limit = 50 } = {}) {
    return this.find()
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef User
 */
module.exports = mongoose.model('User', UserSchema);
