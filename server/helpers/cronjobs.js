
const { MongoClient } = require('mongodb');
const config = require('../../config/config');
const { TrackState } = require('./Enums');

// Schedule the task to run every hour
const mongoUri = config.mongo.host;

const task = async function processTracks() {
    const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();

        const collection = client.db().collection('tracks');
        const now = new Date();

        const query = {
          state: { $ne: TrackState.FINISHED }, // $ne means not equal to
          departureTime: { $lt: now } // $lt means less than
        };

        const update = { $set: { state: TrackState.FINISHED } };
        const result = await collection.updateMany(query, update);

        console.log(`Updated ${result.modifiedCount} tracks.`);
    } finally {
        await client.close();
    }
}

module.exports = task