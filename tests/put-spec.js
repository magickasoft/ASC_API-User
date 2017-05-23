/* eslint-env jasmine */

'use strict';

var config = {
  SRV_NAME: 'profile'
};

var route = require('../routes/put')(config);

// loading dependencies
var mongoose = require('mongoose');
// mongoose.set('debug', true);
var mockgoose = require('mockgoose');
var run = require('./lib/express-unit').run;
var setup = require('./lib/express-unit-default-setup');
var util = require('util');


// loading mocked data
var newProfiles = require('./data/data.json');

describe('profile-ms put handler', function() {
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

  it('should update a profile', function(done) {

    var update = {
      publicEmail: 'newemail@newaddress.com'
    };

    var args = {
      params: {
        id: createdProfiles[0]._id.toString()
      },
      body: update
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      var profile = res.json.mostRecentCall.args[0];
      expect(profile.publicEmail).toEqual(update.publicEmail);
      expect(profile._id.toString()).toEqual(createdProfiles[0]._id.toString());

      done();
    });
  });

  it('should not update a not owned profile', function(done) {

    var update = {
      publicEmail: 'newemail@newaddress.com'
    };

    var args = {
      params: {
        id: createdProfiles[0]._id.toString()
      },
      body: update,
      filterOwner: {
        identityID: createdProfiles[1].identityID.toString()
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();

      var profile = res.json.mostRecentCall.args[0];
      expect(util.isArray(profile)).toBe(false);
      expect(profile.status).toBe(400);

      // check the database
      mongoose.model('Profile').findById(args.params.id)
        .lean().exec(function(_err, dbResult) {
          expect(_err).toBeNull();
          expect(dbResult).toBeDefined();
          expect(dbResult.publicEmail).toEqual(createdProfiles[0].publicEmail);
          expect(dbResult._id.toString()).toEqual(createdProfiles[0]._id.toString());

          mongoose.model('Profile').findById(createdProfiles[1]._id.toString())
          .lean().exec(function(_err, _dbResult) {
            expect(_err).toBeNull();
            expect(_dbResult).toBeDefined();
            expect(_dbResult.publicEmail).toEqual(createdProfiles[1].publicEmail);
            expect(_dbResult._id.toString()).toEqual(createdProfiles[1]._id.toString());

            done();
          });
        });
    });
  });

  it('should not update a profile identityID if it already exists', function(done) {

    var update = {
      identityID: createdProfiles[1].identityID
    };

    var args = {
      params: {
        id: createdProfiles[0]._id.toString()
      },
      body: update
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();

      var error = res.json.mostRecentCall.args[0];
      expect(error.status).toEqual(500);
      expect(error.message).toBeDefined();

      done();
    });
  });
});
