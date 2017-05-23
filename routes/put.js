'use strict';

/**
 * this is an action for the microservice
 */

// Modules loading
var statuses = require('statuses');
var mongoose = require('mongoose');

var Profile = null;

var INVALID_REQUEST= {
  status: 400,
  message: statuses[400]
}

exports = module.exports = function(config) {

  // Log setup
  var debug = require('debug')(`${config.SRV_NAME}:router:put`);

  return function(req, res) {
    Profile = Profile || mongoose.model('Profile');

    req.params = req.params || {};
    debug(`Updating the profile ${req.params.id}`);

    if (req.params.id && req.body) {
      req.filterOwner = req.filterOwner || {};
      req.filterOwner.$and = [{
        _id: req.params.id
      }];
      // be sure update will eventually trigger middleware hooks
      Profile.findOne(req.filterOwner, function(err, doc) {
        if (err) {
          return res.status(500).json({
            message: err,
            status: 500
          });
        }
        if (!doc) {
          return res.status(400).json(INVALID_REQUEST);
        }
        doc.update(req.body, {runValidators: true}, function(_err, customer) {
          if (_err) {
            return res.status(500).json({
              message: _err,
              status: 500
            });
          }
          Profile.findById(req.params.id).lean().exec(function(__err, _doc) {
            res.status(200).json(_doc);
          });
        });
      });
    } else {
      res.status(400).json(INVALID_REQUEST);
    }

  };
};


