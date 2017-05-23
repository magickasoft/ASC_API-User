'use strict';

/**
 * this is an action for the microservice
 */

// Modules loading
var statuses = require('statuses');
var mongoose = require('mongoose');

var Profile = null;

var ACCESS_FORBIDDEN = {
  status: 403,
  message: statuses[403]
};

exports = module.exports = function(config) {

  // Log setup
  var debug = require('debug')(`${config.SRV_NAME}:router:post`);

  return function(req, res) {
    Profile = Profile || mongoose.model('Profile');

    debug('Creating a new profile');

    // simple data validations
    // 0. check if body exists
    if (!req || !req.body) {
      return res.status(400).json({
        message: 'Body is missing',
        status: 400
      });
    }
    // 1. owner can create its profile only
    if (req.filterOwner) {
      var ownerKey = Object.keys(req.filterOwner)[0];
      if (!req.body[ownerKey]) { // autopopulate the field
        req.body[ownerKey] = req.filterOwner[ownerKey];
      } else if (req.body[ownerKey] !== req.filterOwner[ownerKey]) {
        return res.status(403).json(ACCESS_FORBIDDEN);
      }
    }
    // 2. body should have an identityID
    if (!req.body.identityID) {
      return res.status(400).json({
        message: 'The identity ID is required',
        status: 400
      });
    }

    Profile.create(req.body, function(err, profile) {
      if (err || !profile) {
        return res.status(500).json({
          message: err,
          status: 500
        });
      }

      profile = profile.toObject();

      return res.status(201).location('./' + profile._id.toString()).json(profile);
    });
  };
};


