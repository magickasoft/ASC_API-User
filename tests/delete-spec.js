/* eslint-env jasmine */

'use strict';

var config = {
  SRV_NAME: 'profile'
};

var route = require('../routes/delete')(config);

// loading dependencies
var mongoose = require('mongoose');
// mongoose.set('debug', true);
var mockgoose = require('mockgoose');
var run = require('./lib/express-unit').run;
var setup = require('./lib/express-unit-default-setup');
var util = require('util');


// loading mocked data
var newProfiles = require('./data/data.json');

describe('profile-ms delete handler', function() {
  var createdProfiles;

  beforeEach(function(done) {
    mockgoose(mongoose).then(function() {
      mongoose.connect('mongodb://example.com/TestingDB', function(err) {
        // Load model
        require('../models/profiles')(config).then(function() {
          // Create some data
          mongoose.model('Profile').create(newProfiles, function(err, results) {
            createdProfiles = results;
            done(err);
          });
        });
      });
    });
  });

  afterEach(function(done) {
    mockgoose.reset(function() {
      mongoose.disconnect(function() {
        mongoose.unmock(function() {
          delete mongoose.models.Profile;
          done();
        });
      });
    });
  });

  it('should remove a profile', function(done) {

    var args = {
      params: {
        id: createdProfiles[0]._id.toString()
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalled();

      var profile = res.json.mostRecentCall.args[0];
      expect(util.isArray(profile)).toBe(false);
      expect(profile.status).toBe(204);

      // check the database
      mongoose.model('Profile').findById(args.params.id)
        .lean().exec(function(_err, dbResults) {
          expect(_err).toBeNull();
          expect(dbResults).toBeNull();

          // check if the other data are still there
          mongoose.model('Profile').find({_id: createdProfiles[1]._id.toString()})
            .lean().exec(function(__err, _dbResults) {
              expect(__err).toBeNull();
              expect(_dbResults.length).toEqual(1);
              done();
            });
        });
    });
  });

  it('should not remove a not owned profile', function(done) {

    var args = {
      params: {
        id: createdProfiles[0]._id.toString()
      },
      filterOwner: {
        _id: createdProfiles[1]._id.toString()
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalled();

      var profile = res.json.mostRecentCall.args[0];
      expect(util.isArray(profile)).toBe(false);
      expect(profile.status).toBe(204);

      // check the database
      mongoose.model('Profile').findById(args.params.id)
        .lean().exec(function(_err, dbResults) {
          expect(_err).toBeNull();
          expect(dbResults).toBeDefined();

          // check if the other data are still there
          mongoose.model('Profile').find({_id: createdProfiles[1]._id.toString()})
            .lean().exec(function(__err, _dbResults) {
              expect(__err).toBeNull();
              expect(_dbResults.length).toEqual(1);
              done();
            });
        });
    });
  });

});
