const Promise = require('bluebird');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const {AcceptedRoles,UserStates} = require('../helpers/Enums');
const { rename } = require('joi/lib/types/object');

/**
 * Track Schema
 */
const TrackSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  startLocation: {
    coordinates: {
      type: [Number],  // [longitude, latitude]
      required: true
    },
    address: String
  },
  endLocation: {
    coordinates: {
      type: [Number],  // [longitude, latitude]
      required: true
    },
    address: String
  },

  state:{
    type: String,
    require:true,
    enum: {
      values : TrackStates,
      message : "Invalid state.",
    },
    default: "WAITING_PASSENGER",
  },
  maxSeats: { 
    type: Number, 
    required: true 
  }, // Positive integer for maxSeats
  driverComment: { 
    type: String, 
    maxlength: 1000, 
    default:'' ,
  }, 
  passangerComment: { 
    type: String, 
    maxlength: 1000, 
    default:'' ,
  }, 
  departureTime: { type: Date, required: true },

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

TrackSchema.pre('save', async function (next) {
    try {
        // Check if the driver has at least one not FINISHED track
        const existingActiveTrack = await this.constructor.findOne({
          driver: this.driver,
          state: { $ne: "FINISHED" } // Find tracks with state not equal to "FINISHED"
        });
    
        if (existingActiveTrack) {
          const errorMessage = 'Driver already has an active track.';
          return next(new Error(errorMessage));
        }
    
        next();
      } catch (error) {
        next(error);
      }
});

TrackSchema.pre('save', function (next) {
    const currentState = this.state;
    const isFinished = currentState === 'FINISHED';
    const isEditingAllowed = currentState === 'ACTIVE' || currentState === 'WAITING_PASSENGER';
  
    if (this.isModified('state') && !isEditingAllowed) {
      const errorMessage = `Cannot change state from ${currentState}.`;
      return next(new Error(errorMessage));
    }
  
    if (this.isModified('state') && currentState === 'ACTIVE' && !isFinished) {
      const errorMessage = 'Can only update state to "FINISHED" when the track is "ACTIVE".';
      return next(new Error(errorMessage));
    }
    next();
});



TrackSchema.plugin(uniqueValidator);
/**
 * Methods
 */
TrackSchema.method({



});


TrackSchema.set('toJSON', {
  transform: function (doc, ret) {
    // Exclude the '_id' and '__v' fields from the JSON output
    ret.id = ret._id
    delete ret._id;
    delete ret.__v;
  },
});


/**
 * Statics
 */
TrackSchema.statics = {
  /**
   * Get track
   * @param {ObjectId} id - The objectId of track.
   * @returns {Promise<Track, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((track) => {
        if (track) {
          return track;
        }
        const err = new APIError('No such track exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List tracks in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<Track[]>}
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
 * @typedef Track
 */
module.exports = mongoose.model('Track', TrackSchema);
