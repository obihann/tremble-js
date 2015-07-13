var Q, _, amqp, app, config, mkdirp, phantom, port, uuid;

Q = require('q');

mkdirp = require('mkdirp');

uuid = require('uuid');

phantom = require('phantom');

_ = require('lodash');

amqp = require('amqplib');

config = require('./tremble');

port = process.env.PORT || 3002;

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
    console.log('opening %s', 'index');
    config.page.open('http://localhost:' + port, function() {
      return setTimeout(function() {
        console.log("%s, now open", "index.html");
        return deferred.resolve(config);
      }, 3000);
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

module["export"] = app;

amqp.connect(process.env.RABBITMQ_BIGWIG_URL, function(err, conn) {
  return conn.createChannel().then(function(ch) {
    ch.assertQueue('tremble.queue');
    ch.consume(q, function(msg) {
      return phantom.create(function(ph) {
        var commit, ok;
        console.log('Starting phantom');
        commit = uuid.v4();
        Q.all(_.map(config.resolutions, function(res) {
          config = {
            ph: ph,
            commit: commit,
            res: res
          };
          return app.process(config).then(app.open).then(app.setRes).then(app.capture);
        })).done(function() {
          console.log('Shutting down phantom');
          return ph.exit();
        });
        ok = ok.then(function() {
          return ch.prefetch(1);
        });
        return ok = ok.then(function() {
          return ch.consume('tremble.queue', doWork, {
            noAck: false
          });
        });
      });
    });
    return ok;
  });
});
