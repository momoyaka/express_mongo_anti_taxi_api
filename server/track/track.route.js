const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const trackCtrl = require('./track.controller');
const config = require('../../config/config');
const expressJwt = require('express-jwt');


const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  /** GET /api/tracks - Get list of users */
  .get(trackCtrl.list)

  /** POST /api/users - Create new user */
  .post(validate(paramValidation.createTrack),expressJwt({ secret : config.jwtSecret }), trackCtrl.create);

router.route('/:trackId')
  /** GET /api/users/:userId - Get user */
  .get(trackCtrl.get)

  /** PUT /api/users/:userId - Update user */
  .put(validate(paramValidation.updateTrack),expressJwt({ secret : config.jwtSecret }), trackCtrl.update)

  /** DELETE /api/users/:userId - Delete user */
  .delete(trackCtrl.remove);

router.route('/get_by_user')
  .get(validate(paramValidation.getByUser),expressJwt({ secret : config.jwtSecret }), trackCtrl.getByUser())

router.route('/:trackId/depart')
  .post(expressJwt({ secret : config.jwtSecret }), trackCtrl.depart);

router.route('/:trackId/add_passanger')
  .post(expressJwt({ secret : config.jwtSecret }), trackCtrl.addPassanger);

router.route('/:trackId/remove_passanger')
  .post(expressJwt({ secret : config.jwtSecret }), trackCtrl.removePassanger);



/** Load user when API with userId route parameter is hit */
router.param('trackId', trackCtrl.load);


router.route('/:userId/set_state')
  .post(validate(paramValidation.setUserState), expressJwt({ secret : config.jwtSecret }), trackCtrl.setState)


module.exports = router;
