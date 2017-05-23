/* eslint-env jasmine */

'use strict';

var config = {
  SRV_NAME: 'profile'
};

var route = require('../routes/post')(config);

// loading dependencies
var mongoose = require('mongoose');
// mongoose.set('debug', true);
var mockgoose = require('mockgoose');
var run = require('./lib/express-unit').run;
var setup = require('./lib/express-unit-default-setup');
var util = require('util');
var async = require('async');

// loading mocked data
var newProfiles = require('./data/data.json');

describe('profile-ms post handler', function() {

  beforeEach(function(done) {
    mockgoose(mongoose).then(function() {
      mongoose.connect('mongodb://example.com/TestingDB', function(err) {
        require('../models/profiles')(config).then(done).catch(done);
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

  it('should create a new profile', function(done) {

    var args = {
      body: newProfiles[0]
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(res.location).toHaveBeenCalled();

      var profile = res.json.mostRecentCall.args[0];
      expect(profile.publicEmail).toEqual(newProfiles[0].publicEmail);
      expect(profile.identityID.toString()).toEqual(newProfiles[0].identityID);
      done();
    });
  });

  it('should create multiple profiles', function(done) {

    async.map(newProfiles, function(newProfile, cb) {
      var args = {
        body: newProfile
      };

      run(setup(args), route, function(err, req, res) {
        expect(err).toBeNull();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalled();
        expect(res.location).toHaveBeenCalled();

        var profile = res.json.mostRecentCall.args[0];
        expect(profile.publicEmail).toEqual(newProfile.publicEmail);
        expect(profile.skills.length).toEqual(newProfile.skills.length);
        cb(null, profile);
      });
    }, function(err, results) {
      expect(err).toBeNull();
      expect(results.length).toEqual(newProfiles.length);
      var profile = results[1];
      expect(profile.publicEmail).toEqual(newProfiles[1].publicEmail);
      done(err);
    });
  });

  it('should not create two profiles for the same identity', function(done) {
    var profileTwins = [{
      'publicEmail': 'user1@example.com',
      'identityID': '000000000000000000000001'
    }, {
      'publicEmail': 'user2@example.com',
      'identityID': '000000000000000000000001'
    }];

    async.mapSeries(profileTwins, function(newProfile, cb) {
      var args = {
        body: newProfile
      };

      run(setup(args), route, function(err, req, res) {
        var status = res.status.mostRecentCall.args[0];
        if (status === 500) { // this is an error
          return cb(res.json.mostRecentCall.args[0]);
        }
        return cb(null, res.json.mostRecentCall.args[0]);
      });
    }, function(err, results) {
      expect(err).toBeDefined();
      var profiles = results.filter(function(res) {
        return res;
      });
      expect(profiles.length).toEqual(1);

      // check the database
      mongoose.model('Profile').find({
        publicEmail: profileTwins[0].publicEmail
      }).lean().exec(function(_err, dbResults) {
        expect(dbResults.length).toEqual(1);
        done();
      });

    });
  });

  it('should not accept request with no data', function(done) {

    var args = {
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(res.location).not.toHaveBeenCalled();

      // check the database
      mongoose.model('Profile').find({
      }).lean().exec(function(_err, dbResults) {
        expect(dbResults.length).toEqual(0);
        done();
      });
    });
  });

  it('should not create a new profile with an empty identity', function(done) {

    var args = {
      body: {
        'publicEmail': 'user2@example.com',
        'identityID': ''
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(res.location).not.toHaveBeenCalled();

      // check the database
      mongoose.model('Profile').find({
        publicEmail: args.body.publicEmail
      }).lean().exec(function(_err, dbResults) {
        expect(dbResults.length).toEqual(0);
        done();
      });
    });
  });

  it('should autopopulate the owner key from the filterOwner if empty', function(done) {

    var args = {
      body: {
        publicEmail: newProfiles[0].publicEmail
      },
      filterOwner: {
        identityID: newProfiles[0].identityID
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(res.location).toHaveBeenCalled();

      var profile = res.json.mostRecentCall.args[0];
      expect(profile.publicEmail).toEqual(newProfiles[0].publicEmail);
      expect(profile.identityID.toString()).toEqual(newProfiles[0].identityID);
      done();
    });
  });

  it('should not create a profile of a different identity', function(done) {

    var args = {
      body: newProfiles[0],
      filterOwner: {
        identityID: newProfiles[1].identityID
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalled();
      expect(res.location).not.toHaveBeenCalled();

      // check the database\
      mongoose.model('Profile').find({
        identityID: args.body.identityID
      }).lean().exec(function(_err, dbResults) {
        expect(dbResults.length).toEqual(0);
        done();
      });
    });
  });


});
