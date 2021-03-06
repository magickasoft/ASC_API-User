'use strict';

/**
 * this is an action for the microservice
 */

// Modules loading
var statuses = require('statuses');
var mongoose = require('mongoose');

var Profile = null;

var NOCONTENT = {
  status: 204,
  message: statuses[204]
};

var ACCESS_FORBIDDEN = {
  status: 403,
  message: statuses[403]
};

exports = module.exports = function(config) {

  // Log setup
  var debug = require('debug')(`${config.SRV_NAME}:router:delete`);

  return function(req, res) {
    Profile = Profile || mongoose.model('Profile');

    req.params = req.params || {};
    debug(`Deleting the profile ${req.params.id}`);

    if (req.params.id) {
      req.filterOwner = req.filterOwner || {};
      req.filterOwner.$and = [{
        _id: req.params.id
      }];
      // be sure remove will eventually trigger middleware hooks
      Profile.findOne(req.filterOwner, function(err, result) {
        if (err) {
          return res.status(500).json({
            message: err,
            status: 500
          });
        }
        if (!result) {
          return res.status(204).json(NOCONTENT);
        }
        result.remove(function(_err, _result) {
          if (_err) {
            return res.status(500).json({
              message: _err,
              status: 500
            });
          }
          return res.status(204).json(NOCONTENT);
        });
      });
    } else {
      res.status(403).json(ACCESS_FORBIDDEN);
    }
  };

};

