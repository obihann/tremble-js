var MongoStore, Q, _, app, express, mkdirp, mongoose, session, winston;

winston = require('winston');

mongoose = require('mongoose');

express = require('express');

session = require('express-session');

MongoStore = require('connect-mongo')(session);

Q = require('q');

mkdirp = require('mkdirp');

_ = require('lodash');

app = {
  capture: function(config) {
    var deferred, filename;
    deferred = Q.defer();
    filename = config.commit + '/' + config.route_name + '.';
    filename += config.res.width + '-' + config.res.height + '.png';
    winston.log('verbose', 'rendering %s', filename);
    config.page.render(filename, function() {
      winston.log('verbose', 'render of %s complete', filename);
      return deferred.resolve(config);
    });
    return deferred.promise;
  },
  setRes: function(config) {
    var deferred, size;
    deferred = Q.defer();
    winston.log('verbose', 'setting viewport to %sx%s', config.res.width, config.res.height);
    size = {
      width: config.res.width,
      height: config.res.height
    };
    config.page.set('viewportSize', size, function(status) {
      if (status.height === size.height && status.width === status.width) {
        winston.log('verbose', 'viewport size now %sx%s', config.res.width, config.res.height);
        return deferred.resolve(config);
      } else {
        winston.error(status);
        return deferred.reject(status);
      }
    });
    return deferred.promise;
  },
  open: function(config) {
    var deferred;
    deferred = Q.defer();
    winston.log('verbose', 'opening %s', config.route_name);
    config.page.open(config.host + ':' + config.port + '/' + config.route, function(status) {
      if (status === 'success') {
        return setTimeout(function() {
          winston.log('verbose', '%s, now open %s', config.route, status);
          return deferred.resolve(config);
        }, config.delay);
      } else {
        winston.error(status);
        return deferred.reject(status);
      }
    });
    return deferred.promise;
  },
  process: function(config) {
    var deferred;
    deferred = Q.defer();
    mkdirp(config.commit, function(err) {
      if (err === null) {
        winston.log('verbose', 'mkdir %s', config.commit);
        return config.ph.createPage(function(page) {
          config.page = page;
          return deferred.resolve(config);
        });
      } else {
        winston.error(err);
        return deferred.reject(err);
      }
    });
    return deferred.promise;
  }
};

module.exports = app;
