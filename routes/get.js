'use strict';

/**
 * this is a microservice action
 */

var mongoose = require('mongoose');

var Profile = null;

exports = module.exports = function(config) {

  // Log setup
  var debug = require('debug')(`${config.SRV_NAME}:router:get`);

  return function(req, res) {
    Profile = Profile || mongoose.model('Profile');

    req.params = req.params || {};
    debug((req.params.id) ? `Get a profile by ID ${req.params.id}` : req.query && `Query profiles by ${require('util').inspect(req.query)}` || '');

    var query;
    if (req.filterOwner) { // owner based filtering
      debug('Filtering by', req.filterOwner);
      req.filterOwner.$and = [(req.params.id) ? { _id: req.params.id } : req.query ];
      query = (req.params.id) ? Profile.findOne(req.filterOwner) : Profile.find(req.filterOwner);
    } else {
      query = (req.params.id) ? Profile.findById(req.params.id) : Profile.find(req.query);
    }

    query.lean().exec(function(err, result) {
      if (err) {
        res.status(500).json({
          message: err,
          status: 500
        });
      } else {
        res.status(200).json(result);
      }
    });
  };
};
