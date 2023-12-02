const mongoose = require("mongoose");

/**
 * Car Schema
 */
const CarSchema = new mongoose.Schema({
    model: { type: String, required: true },
    color: { type: String, required: true },
    regNumber: { type: String, required: true },
});

CarSchema.set('toJSON', {
    transform: function (doc, ret) {
      // Exclude the '_id' and '__v' fields from the JSON output
      delete ret._id;
      delete ret.__v;
    },
  });

/**
 * @typedef Car
 */
module.exports = mongoose.model('Car', CarSchema)