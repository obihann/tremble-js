var Q, _, app, fs, mkdirp, phantom, winston;

fs = require('fs');

winston = require('winston');

Q = require('q');

mkdirp = require('mkdirp');

_ = require('lodash');

phantom = require('phantom');

winston.level = process.env.WINSTON_LEVEL;

app = {
  capture: function(config) {
    var deferred, filename;
    winston.log('info', 'app.capture');
    deferred = Q.defer();
    filename = 'screenshots/' + config.commit + '/' + config.route_name + '.';
    filename += config.res.width + '-' + config.res.height + '.png';
    winston.log('verbose', 'rendering %s', filename);
    config.page.renderBase64('PNG', function(dataString) {
      var buffer;
      winston.log('verbose', 'render of %s complete', filename);
      buffer = new Buffer(dataString, 'base64');
      return fs.writeFile(filename, buffer, function(err) {
        if (err) {
          deferred.reject("unable to save image");
        }
        winston.log('verbose', 'file %s saved to filesystem', filename);
        return app.dropbox.writeFile("tremble-js/" + filename, buffer, function(err, stat) {
          if (err) {
            deferred.reject("unable to save image to dropbox");
          }
          winston.log('verbose', 'file %s saved to dropbox', filename);
          return deferred.resolve(config);
        });
      });
    });
    return deferred.promise;
  },
  setRes: function(config) {
    var deferred, size;
    winston.log('info', 'app.setRes');
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
    var deferred, pagePath;
    winston.log('info', 'app.open');
    deferred = Q.defer();
    winston.log('verbose', 'opening %s', config.route_name);
    pagePath = config.host + ':' + config.port + '/tremble/' + config.route;
    config.page.open(pagePath, function(status) {
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
    winston.log('info', 'app.process');
    deferred = Q.defer();
    mkdirp('screenshots/' + config.commit, function(err) {
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
