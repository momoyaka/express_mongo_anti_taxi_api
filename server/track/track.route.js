const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const trackCtrl = require('./track.controller');
const config = require('../../config/config');
const expressJwt = require('express-jwt');


const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  /** GET /api/tracks - Get list of users */
  .get(validate(paramValidation.list), validate(paramValidation.trackList),trackCtrl.nearestList)

  /** POST /api/users - Create new user */
  .post(validate(paramValidation.createTrack),expressJwt({ secret : config.jwtSecret, userProperty: 'owner'}), trackCtrl.create);

router.route('/:trackId')
  /** GET /api/users/:userId - Get user */
  .get(trackCtrl.get)

  /** PUT /api/users/:userId - Update user */
  .put(validate(paramValidation.updateTrack),expressJwt({ secret : config.jwtSecret, userProperty: 'owner'}), trackCtrl.update)

  /** DELETE /api/users/:userId - Delete user */
  .delete(expressJwt({ secret : config.jwtSecret, userProperty: 'owner'}), trackCtrl.remove);

   
router.route('/get_my_track')
  /** GET /api/tracks/get_my_track - Get list of users */
  .get(validate(paramValidation.getByUser),expressJwt({ secret : config.jwtSecret, userPropetry: 'owner'}), trackCtrl.getByUser)

router.route('/:trackId/depart')
  .post(expressJwt({ secret : config.jwtSecret, userProperty: 'owner'}), trackCtrl.depart);

  router.route('/:trackId/finish')
  .post(expressJwt({ secret : config.jwtSecret, userProperty: 'owner'}), trackCtrl.finish);

router.route('/:trackId/add_passenger')
  .post(expressJwt({ secret : config.jwtSecret, userProperty: 'owner'}), trackCtrl.addPassenger);

router.route('/:trackId/remove_passenger')
  .post(expressJwt({ secret : config.jwtSecret,userProperty: 'owner'}), trackCtrl.removePassenger);

router.route('/:trackId/comment')
  .post(validate(paramValidation.trackComment),expressJwt({ secret : config.jwtSecret, userProperty: 'owner'}), trackCtrl.comment);

/** Load user when API with userId route parameter is hit */
router.param('trackId', trackCtrl.load);


module.exports = router;
