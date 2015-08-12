var Q, _, amqp, app, compare, config, doWork, dropbox, loadRabbit, loadUserData, mkdirp, models, mongoose, phantom, port, q, rabbitMQ, setupError, setupWorker, uuid, winston;

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

console.log(config);

models = require("./utils/schema").models;

app = require("./tasks/phantom");

compare = require("./tasks/compare");

winston.level = process.env.WINSTON_LEVEL;

port = process.env.PORT || 3002;

rabbitMQ = process.env.RABBITMQ_BIGWIG_URL;

q = process.env.RABBITMQ_QUEUE;

Q.longStackSupport = true;

mongoose.connect(process.env.MONGO_DB);

setupError = function(err) {
  winston.error(err);
  return process.exit(1);
};

doWork = function(msg) {
  var body, e, mkSSDir, ssDir;
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
  body = JSON.parse(msg.content.toString());
  return loadUserData(app, body.sender.login).then(function(app) {
    var commit, logEntry, type, username;
    commit = body.head_commit.id;
    logEntry = new models.log({
      commit: commit,
      repo: body.repository.full_name,
      request: msg.content
    });
    app.user.repo = body.repository.full_name;
    if (typeof body.organization !== 'undefined') {
      username = body.organization.login;
      type = 'org';
    } else {
      username = body.repository.owner.login;
      type = 'user';
    }
    return phantom.create(function(ph) {
      winston.log('info', 'Starting phantom');
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
            res: res,
            repo: body.repository.full_name
          };
          return app.process(config).then(app.open).then(app.setRes).then(app.capture).then(app.updateUser).then(app.saveDropbox)["catch"](function(err) {
            winston.error(err);
            return app.rabbitCH.nack(msg, false, false);
          });
        }));
      })).then(function(res) {
        var deferred, keys;
        deferred = Q.defer();
        logEntry.user = app.user;
        app.user.images.sort(function(a, b) {
          if (a.createdAt < b.createdAt) {
            1;
          }
          if (b.createdAt < a.createdAt) {
            -1;
          }
          return 0;
        });
        keys = [];
        _.each(app.user.images, function(img) {
          if (keys.indexOf(img.commit) <= -1) {
            return keys.push(img.commit);
          }
        });
        if (keys.length >= 3) {
          keys = keys.slice(1, 3);
        }
        app.user.images = _.filter(app.user.images, function(img) {
          return keys.indexOf(img.commit) > -1;
        });
        app.user.save(function(err) {
          if (err) {
            deferred.reject(err);
          }
          winston.log('info', 'saved image in mongo');
          return deferred.resolve(app.user);
        });
        return deferred.promise;
      }).then(compare.saveToDisk).then(compare.compare).then(function(user) {
        var deferred;
        deferred = Q.defer();
        logEntry.results = app.user.newResults;
        logEntry.status = "success";
        logEntry.save(function(err) {
          if (err) {
            return deferred.reject(err);
          }
        });
        user.save(function(err) {
          if (err) {
            deferred.reject(err);
          }
          winston.log('info', 'saved compare results in mongo');
          return deferred.resolve(app.user);
        });
        winston.log('info', 'Shutting down phantom');
        app.rabbitCH.ack(msg);
        ph.exit();
        return deferred.promise;
      })["catch"](function(err) {
        logEntry.status = "error";
        logEntry.message = err;
        return logEntry.save(function(err) {
          if (err) {
            return deferred.reject(err);
          }
        });
      });
    });
  });
};

setupWorker = function(app) {
  var ok;
  winston.log('info', 'setting up worker');
  winston.log('info', 'asserting channel %s', q);
  ok = app.rabbitCH.assertQueue(q, {
    durable: true
  });
  ok = ok.then(function() {
    return app.rabbitCH.prefetch(1);
  });
  ok = ok.then(function() {
    return app.rabbitCH.consume(q, doWork, {
      noAck: false
    });
  });
  return ok;
};

loadUserData = function(app, login) {
  winston.log('info', 'loading user from database');
  return models.user.findOne({
    username: login
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

loadRabbit(app).then(setupWorker);

module.exports = app;
