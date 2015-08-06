var Q, _, amqp, app, config, doWork, dropbox, loadRabbit, loadUserData, mkdirp, models, mongoose, phantom, port, q, rabbitMQ, setupError, setupWorker, uuid, winston;

winston = require('winston');

Q = require('q');

amqp = require('amqplib');

mkdirp = require('mkdirp');

_ = require('lodash');

phantom = require('phantom');

uuid = require('uuid');

config = require('./tremble');

dropbox = require('dropbox');

mongoose = require('mongoose');

models = require("./schema").models;

app = require("./phantom");

winston.level = process.env.WINSTON_LEVEL;

port = process.env.PORT || 3002;

rabbitMQ = process.env.RABBITMQ_BIGWIG_URL;

q = process.env.RABBITMQ_QUEUE;

mongoose.connect(process.env.MONGO_DB);

doWork = function() {
  var e, mkSSDir, ssDir;
  winston.log('info', 'doWork');
  mkSSDir = function() {
    return mkdirp('screenshots', function(err) {
      if (err === null) {
        return winston.log('verbose', 'mkdir screenshots');
      }
    });
  };
  try {
    ssDir = fs.lstatSync('screenshots');
    if (ssDir.isDirectory() !== true) {
      mkSSDir();
    }
  } catch (_error) {
    e = _error;
    mkSSDir();
  }
  return phantom.create(function(ph) {
    var commit;
    winston.log('info', 'Starting phantom');
    commit = uuid.v4();
    return Q.all(_.map(config.pages, function(page) {
      return Q.all(_.map(config.resolutions, function(res) {
        config = {
          host: "http://localhost",
          route_name: page.title,
          route: page.path,
          delay: config.delay,
          port: port,
          ph: ph,
          commit: commit,
          res: res
        };
        return app.process(config).then(app.open).then(app.setRes).then(app.capture);
      }));
    })).done(function() {
      winston.log('info', 'Shutting down phantom');
      return ph.exit();
    });
  });
};

setupError = function(err) {
  winston.error(err);
  return process.exit(1);
};

setupWorker = function(app) {
  var ok;
  winston.log('info', 'setting up worker');
  winston.log('info', 'asserting channel %s', q);
  ok = app.rabbitCH.assertQueue(q, {
    durable: true
  });
  ok = ok.then(function() {
    return ch.prefetch(1);
  });
  ok = ok.then(function() {
    return app.rabbitCH.consume(q, doWork, {
      noAck: false
    });
  });
  return ok;
};

loadUserData = function(app) {
  winston.log('info', 'loading user from database');
  return models.user.findOne({
    _id: '55c110a0fa70af612fb1d844'
  }).exec().then(function(user) {
    app.user = user;
    return app;
  }).then(function(app) {
    var client;
    client = new dropbox.Client({
      key: process.env.DROPBOX_KEY,
      secret: process.env.DROPBOX_SECRET,
      sandbox: true,
      token: app.user.dropbox.accessToken
    });
    client.authDriver(new dropbox.AuthDriver.NodeServer(8191));
    app.dropbox = client;
    return app;
  }).then(function(app) {
    app.dropbox.getAccountInfo(function(err, accountInfo) {
      if (err) {
        setupError(err);
      }
      return winston.verbose("Hello, %s", accountInfo.name);
    });
    return app;
  }).then(null, function(err) {
    if (err) {
      return setupError(err);
    }
  }).end();
};

loadRabbit = function(app) {
  winston.log('info', 'connecting to rabbitMQ %s', rabbitMQ);
  return amqp.connect(rabbitMQ).then(function(conn) {
    winston.log('info', 'creating channel');
    app.rabbitConn = conn;
    return conn.createChannel();
  }).then(function(ch) {
    app.rabbitCH = ch;
    return app;
  })["catch"](function(err) {
    return setupError(err);
  });
};

loadUserData(app).then(loadRabbit).then(setupWorker);

module.exports = app;
