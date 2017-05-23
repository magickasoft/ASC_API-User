/* eslint-env jasmine */

'use strict';

var config = {
  SRV_NAME: 'profile'
};

var route = require('../routes/get')(config);

// loading dependencies
var mongoose = require('mongoose');
// mongoose.set('debug', true);
var mockgoose = require('mockgoose');
var run = require('./lib/express-unit').run;
var setup = require('./lib/express-unit-default-setup');
var util = require('util');


// loading mocked data
var newProfiles = require('./data/data.json');

describe('profile-ms get handler', function() {
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
        })
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

  it('should get all profiles', function(done) {

    var args = {
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      var profiles = res.json.mostRecentCall.args[0];
      expect(util.isArray(profiles)).toBe(true);
      expect(createdProfiles.length).toBe(profiles.length);

      done();
    });
  });

  it('should get one profile', function(done) {

    var args = {
      params: {
        id: createdProfiles[0]._id.toString()
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      var profile = res.json.mostRecentCall.args[0];
      expect(util.isArray(profile)).toBe(false);
      expect(createdProfiles[0]._id.toString()).toEqual(profile._id.toString());

      done();
    });
  });

  it('should select one profile', function(done) {

    var args = {
      query: {
        'publicEmail': createdProfiles[0].publicEmail
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      var profiles = res.json.mostRecentCall.args[0];
      expect(util.isArray(profiles)).toBe(true);
      expect(profiles.length).toBe(1);
      expect(createdProfiles[0]._id.toString()).toEqual(profiles[0]._id.toString());

      done();
    });
  });

  it('should not select any profiles', function(done) {

    var args = {
      query: {
        'publicEmail': 'notuser@example.com'
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      var profiles = res.json.mostRecentCall.args[0];
      expect(util.isArray(profiles)).toBe(true);
      expect(profiles.length).toBe(0);

      done();
    });
  });

  it('should return only own profile when querying for all', function(done) {

    var args = {
      filterOwner: {
        'identityID': createdProfiles[0].identityID
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      var profiles = res.json.mostRecentCall.args[0];
      expect(util.isArray(profiles)).toBe(true);
      expect(profiles.length).toBe(1);
      expect(createdProfiles[0]._id.toString()).toEqual(profiles[0]._id.toString());

      done();
    });
  });

  it('should not select any profiles when querying for not owned profile', function(done) {

    var args = {
      filterOwner: {
        'identityID': createdProfiles[0].identityID
      },
      query: {
        'identityID': createdProfiles[1].identityID
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      var profiles = res.json.mostRecentCall.args[0];
      expect(util.isArray(profiles)).toBe(true);
      expect(profiles.length).toBe(0);

      done();
    });
  });

  it('should not select any profiles when getting a not owned profile', function(done) {

    var args = {
      filterOwner: {
        'identityID': createdProfiles[0].identityID
      },
      params: {
        'id': createdProfiles[1]._id
      }
    };

    run(setup(args), route, function(err, req, res) {
      expect(err).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      var profile = res.json.mostRecentCall.args[0];
      expect(util.isArray(profile)).toBe(false);
      expect(profile).toBeNull();

      done();
    });
  });

});
