const Promise = require('bluebird');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const {AcceptedRoles,UserStates, TrackStates,TrackState} = require('../helpers/Enums');
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
    set: function(state) {
        this._previousState = this.state;
        return state;
    },
    default: TrackState.WAITING_PASSENGER,
  },
  maxSeats: { 
    type: Number, 
    required: true ,
    default:1,
  }, // Positive integer for maxSeats
  driverComment: { 
    type: String, 
    maxlength: 1000, 
    default:'' ,
  }, 
  passengerComment: { 
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

// TrackSchema.pre('save', async function (next) {
//     try {
//         // Check if the driver has at least one not FINISHED track
        
//         const existingActiveTrack = await this.constructor.findOne({
//             driver: this.driver,
//             departureTime: { $gt: new Date() } // Check for tracks with future departure times
//           });
    
//         if (existingActiveTrack) {
//           const errorMessage = 'Driver already has an active track.';
//           return next(new APIError(errorMessage, httpStatus.METHOD_NOT_ALLOWED));
//         }
    
//         next();
//       } catch (error) {
//         next(error);
//       }
// });

TrackSchema.pre('save', function (next) {
    const currentState = this._previousState;
    const isFinished = this.state === TrackState.FINISHED;
    const isEditingAllowed = currentState === TrackState.ACTIVE || currentState === TrackState.WAITING_PASSENGER || currentState === TrackState.WAITING_DEPARTURE;
  
    if (this.isModified('state') && !isEditingAllowed) {
      const errorMessage = `Cannot change state from ${currentState}.`;
      return next(new Error(errorMessage));
    }
  
    if (this.isModified('state') && currentState === TrackState.ACTIVE  && !isFinished) {
      const errorMessage = 'Can only update state to "FINISHED" when the track is "ACTIVE".';
      return next(new Error(errorMessage));
    }
    next();
});

TrackSchema.pre('deleteOne',  { document: true } ,function (next) {
    const currentState = this.state;
    const isRemovingAllowed = currentState === TrackState.WAITING_PASSENGER || currentState === TrackState.WAITING_DEPARTURE;
    if (!isRemovingAllowed) {
      const errorMessage = 'Delete not allowed from current state';
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

  getActiveByUser(userId)
  {
    return this.findOne({
        $or: [
            { driver: userId },
            { passenger: userId }
        ],
        state: { $ne: TrackState.FINISHED } // Find tracks with state not equal to "FINISHED"
      })
    .exec()
    .then((track) => {
      if (track) {
        return track;
      }
      const err = new APIError('User has not active track exists!', httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  isUserDriverOfTrack(userId, trackId) {
  
      // Check if the track with the given ID exists
    return this.findById(trackId)
    .exec()
    .then((track)=>{
    if (!track) {
        const err = new APIError('User has not active track exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
    }
    if (track.driver.equals(userId)) {
        return true;
    }
    else {
        return false;
    }

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
  },
  /**
   * List tracks in descending order of sum distance from given start, end coords.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<Track[]>}
   */
  nearestList({skip = 0, limit = 50, sX = 0, sY = 0, eX, eY} = {}) {
    return this.aggregate([
      {
        $match: { state: TrackState.WAITING_PASSENGER }, // Filter only tracks in the WAITING_PASSENGER state
      },
      {
        $addFields: {
          startDistance: {
            $sqrt: {
              $sum: [
                { $pow: [{ $subtract: [{ $arrayElemAt: ["$startLocation.coordinates", 0] }, sX] }, 2] },
                { $pow: [{ $subtract: [{ $arrayElemAt: ["$startLocation.coordinates", 1] }, sY] }, 2] },
              ],
            },
          },
          endDistance: {
            $sqrt: {
              $sum: [
                { $pow: [{ $subtract: [{ $arrayElemAt: ["$endLocation.coordinates", 0] }, eX] }, 2] },
                { $pow: [{ $subtract: [{ $arrayElemAt: ["$endLocation.coordinates", 1] }, eY] }, 2] },
              ],
            },
          },
        },
      },
      {
        $addFields: {
          totalDistance: { $add: ["$startDistance", "$endDistance"] },
        },
      },
      {
        $lookup: {
          from: 'users', // Assuming the User model is stored in a collection named 'users'
          localField: 'driver',
          foreignField: '_id',
          as: 'driverInfo',
        },
      },
      {
        $unwind: '$driverInfo', // If a track can have only one driver
      },
      {
        $addFields: {
          driverName: '$driverInfo.username',
          driverPhone: '$driverInfo.phoneNumber',
        },
      },

      {
        $project: {
          id: '$_id', // Rename "_id" to "id"
          driver: 1,
          passenger:1,
          startLocation: 1,
          endLocation: 1,
          state: 1,
          maxSeats: 1,
          driverComment: 1,
          passengerComment: 1,
          departureTime: 1,
          createdAt: 1,
          startDistance: 1,
          endDistance: 1,
          totalDistance: 1,
          driverName: 1,
          driverPhone: 1,
        }
      },
      {
        $project: {
          __v: 0, // Exclude the "__v" field
          _id: 0, // Exclude the "_id" field
        }
      },
      {
        $sort: { totalDistance: 1 }, // Sort by total distance in ascending order
      },
    ])
    .skip(skip)
    .limit(limit)
    .exec()
  }
};

/**
 * @typedef Track
 */
module.exports = mongoose.model('Track', TrackSchema);
