var Q, _, app, mkdirp;

Q = require('q');

mkdirp = require('mkdirp');

_ = require('lodash');

app = {
  capture: function(config) {
    var deferred, filename;
    deferred = Q.defer();
    filename = config.commit + '/index.';
    filename += config.res.width + '-' + config.res.height + '.png';
    console.log('rendering %s', filename);
    config.page.render(filename, function() {
      console.log("render of %s complete", filename);
      return deferred.resolve(config);
    });
    return deferred.promise;
  },
  setRes: function(config) {
    var deferred, size;
    deferred = Q.defer();
    console.log('setting viewport to %sx%s', config.res.width, config.res.height);
    size = {
      width: config.res.width,
      height: config.res.height
    };
    config.page.set('viewportSize', size, function() {
      console.log('viewport size now %sx%s', config.res.width, config.res.height);
      return deferred.resolve(config);
    });
    return deferred.promise;
  },
  open: function(config) {
    var deferred;
    deferred = Q.defer();
    console.log('opening %s', config.route);
    config.page.open(config.host + ':' + config.port + '/' + config.route, function() {
      return setTimeout(function() {
        console.log("%s, now open", config.route);
        return deferred.resolve(config);
      }, config.delay);
    });
    return deferred.promise;
  },
  process: function(config) {
    var deferred;
    deferred = Q.defer();
    mkdirp(config.commit, function(err) {
      console.log('mkdir %s', config.commit);
      return config.ph.createPage(function(page) {
        config.page = page;
        return deferred.resolve(config);
      });
    });
    return deferred.promise;
  }
};

module.exports = app;
