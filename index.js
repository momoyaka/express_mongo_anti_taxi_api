const mongoose = require('mongoose');
const util = require('util');
const cron = require('node-cron');

// config should be imported before importing any other file
const config = require('./config/config');
const app = require('./config/express');
const task = require('./server/helpers/cronjobs');

const debug = require('debug')('express-mongoose-es6-rest-api:index');

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

// plugin bluebird promise in mongoose
mongoose.Promise = Promise;

// connect to mongo db
const mongoUri = `mongodb://${config.mongo.user}:${config.mongo.pass}@${config.mongo.host}:${config.mongo.port}/${config.mongo.db}`;
mongoose.connect(mongoUri, {  
  useNewUrlParser: true,
  useUnifiedTopology: true,
  keepAlive: true });
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoUri}`);
});

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB successfully');
  // Start your application logic here
});

const modelNames = mongoose.modelNames();

// Drop all models

// modelNames.forEach((modelName) => {
//   delete mongoose.connection.models[modelName];
// });


cron.schedule('*/60 * * * * *', () => {
  task();
});
task();

// print mongoose logs in dev env
if (config.mongooseDebug) {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
  });
}

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {
  // listen on port config.port
  app.listen(config.port, () => {
    console.info(`server started on port ${config.port} (${config.env})`); // eslint-disable-line no-console
  });
}

module.exports = app;
