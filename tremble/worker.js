var Q, _, app, mkdirp, winston;

winston = require('winston');

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
    config.page.set('viewportSize', size, function() {
      winston.log('verbose', 'viewport size now %sx%s', config.res.width, config.res.height);
      return deferred.resolve(config);
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
        return deferred.reject(status);
      }
    });
    return deferred.promise;
  },
  process: function(config) {
    var deferred;
    deferred = Q.defer();
    mkdirp(config.commit, function(err) {
      winston.log('verbose', 'mkdir %s', config.commit);
      return config.ph.createPage(function(page) {
        config.page = page;
        return deferred.resolve(config);
      });
    });
    return deferred.promise;
  }
};

module.exports = app;
