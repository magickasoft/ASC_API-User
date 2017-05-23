/* eslint no-invalid-this:0 */

'use strict';

/**
 * This file loads a model from a Swagger definition
 */

// Modules loading
var path = require('path');
var RefParser = require('json-schema-ref-parser');

exports = module.exports = function(config) {
  // this is the swagger file
  var SWAGGER_FILE = path.join(__dirname, `../swagger/api/${config.SRV_NAME}.yaml`);

  // Log setup
  var debug = require('debug')(`${config.SRV_NAME}:model:${config.SRV_NAME}`);

  var collection = {};

  // loading schema definition from Swagger file
  var parser = new RefParser()
    .bundle(SWAGGER_FILE)
    .then(function(schema) {

      var crypto = require('crypto');
      var mongoose = require('mongoose');
      var Profile;

      var swaggerMongoose = require('swaggering-mongoose');

      // schemas and modules compilation
      var definitions = swaggerMongoose.getDefinitions(schema);
      var schemas = swaggerMongoose.getSchemas(definitions);
      var ProfileSchema = schemas.Profile;

      // createdAt, updatedAt timestamps
      ProfileSchema.set('timestamps', true);

      /**
       * Additional Mongoose Validations
       */

      ProfileSchema.path('identityID').validate(function(value, done) {
        Profile = Profile || mongoose.model('Profile');
        // Check if it already exists
        Profile.count({
          identityID: value
        }, function(err, count) {
          if (err) {
            return done(err);
          }

          // If `count` is greater than zero, 'invalidate'
          return done(count === 0);
        });
      }, 'A profile for this identity already exists');

      var models = collection.model = swaggerMongoose.getModels(schemas);

    }).catch(function(error) {
      debug('Parser error:', error);
    });

  // promisify
  collection.then = parser.then.bind(parser);
  collection.catch = parser.catch.bind(parser);
  return collection;

};
