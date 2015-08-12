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
    winston.log('info', 'phantom.capture');
    deferred = Q.defer();
    filename = 'screenshots/' + config.commit + '/' + config.route_name + '.';
    filename += config.res.width + '-' + config.res.height + '.png';
    winston.log('verbose', 'rendering %s', filename);
    config.page.renderBase64('PNG', function(dataString) {
      winston.log('verbose', 'render of %s complete', filename);
      config.dataString = dataString;
      return deferred.resolve(config);
    });
    return deferred.promise;
  },
  updateUser: function(config) {
    var deferred, filename, obj;
    winston.log('info', 'phantom.updateUser');
    deferred = Q.defer();
    filename = config.commit + '/' + config.route_name + '.';
    filename += config.res.width + '-' + config.res.height + '.png';
    obj = {
      filename: filename,
      dropbox: 'Apps/tremble-js/screenshots/' + filename,
      commit: config.commit,
      data: config.dataString,
      createdAt: Date.now()
    };
    app.user.images.push(obj);
    deferred.resolve(config);
    return deferred.promise;
  },
  saveDropbox: function(config) {
    var buffer, deferred, filename;
    winston.log('info', 'phantom.saveDropbox');
    deferred = Q.defer();
    filename = 'Apps/tremble-js/screenshots/';
    filename += config.commit + '/' + config.route_name + '.';
    filename += config.res.width + '-' + config.res.height + '.png';
    buffer = new Buffer(config.dataString, 'base64');
    app.dropbox.writeFile(filename, buffer, function(err, stat) {
      if (err) {
        deferred.reject("unable to save image to dropbox");
      }
      winston.log('verbose', 'file %s saved to dropbox', filename);
      return deferred.resolve(config);
    });
    return deferred.promise;
  },
  setRes: function(config) {
    var deferred, size;
    winston.log('info', 'phantom.setRes');
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
    winston.log('info', 'phantom.open');
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
    winston.log('info', 'phantom.process');
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
