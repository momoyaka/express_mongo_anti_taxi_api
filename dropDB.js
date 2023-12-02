const mongoose = require('mongoose');
const config = require('./config/config');

const dropDatabase = async () => {
    try {
        const mongoUri = config.mongo.host;
        // Connect to the MongoDB database
        await mongoose.connect(mongoUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
    
        // Drop the database
        await mongoose.connection.dropDatabase();
    
        console.log('Database dropped successfully.');
      } catch (error) {
        console.error('Error dropping database:', error);
      } finally {
        // Disconnect from the MongoDB database
        await mongoose.disconnect();
      }
};

dropDatabase();