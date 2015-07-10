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
    var deferred, filename;
    deferred = Q.defer();
    filename = commit + '/index.' + res.width + '-' + res.height + '.png';
    console.log('rendering %s', filename);
    page.render(filename, function() {
      console.log("render of %s complete", filename);
      return deferred.resolve();
    });
    return deferred.promise;
  },
  setRes: function(page, res) {
    var deferred, size;
    deferred = Q.defer();
    console.log('setting viewport to %s%s', res.width, res.height);
    size = {
      width: res.width,
      height: res.height
    };
    page.set('viewportSize', size, function() {
      console.log('viewport size now %sx%s', res.width, res.height);
      return deferred.resolve();
    });
    return deferred.promise;
  },
  open: function(page) {
    var deferred;
    deferred = Q.defer();
    console.log('opening %s', 'index');
    page.open('http://localhost:' + port, function() {
      console.log("%s, now open", "index.html");
      return deferred.resolve();
    });
    return deferred.promise;
  },
  process: function(ph) {
    return mkdirp(commit, function(err) {
      console.log('mkdir %s', commit);
      return ph.createPage(function(page) {
        return app.open(page).then(function() {
          Q.all(_.map(config.resolutions, function(res) {
            return app.setRes(page, res).then(app.capture(page, res));
          })).done(function() {});
          console.log('Shutting down phantom');
          return ph.exit();
        });
      });
    });
  }
};

module["export"] = app;

phantom.create(function(ph) {
  return app.process(ph);
});
