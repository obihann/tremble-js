var Q, _, app, commit, config, mkdirp, phantom, port, uuid;

Q = require('q');

mkdirp = require('mkdirp');

uuid = require('uuid');

phantom = require('phantom');

_ = require('lodash');

commit = uuid.v4();

config = require('./tremble');

port = process.env.PORT || 3002;

app = {
  capture: function(page, res) {
    var deferred;
    deferred = Q.defer();
    console.log('setting viewport to %s%s', res.width, res.height);
    page.set('viewportSize', {
      width: res.width,
      height: res.height
    }, function(err) {
      console.log('opening %s', 'index');
      page.open('http://localhost:' + port, function() {
        var filename;
        filename = commit + '/index.' + res.width + '-' + res.height + '.png';
        console.log('rendering %s', filename);
        page.render(filename, function() {
          deferred.resolve();
        });
      });
    });
    return deferred.promise;
  },
  process: function() {
    mkdirp(commit, function(err) {
      console.log('mkdir %s', commit);
      phantom.create(function(ph) {
        ph.createPage(function(page) {
          Q.allSettled(_.map(config.resolutions, function(res) {
            return app.capture(page, res);
          })).then(function() {
            console.log('Shutting down phantom');
            ph.exit();
          });
        });
      });
    });
  }
};

module["export"] = app;

app.process();
