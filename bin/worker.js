var Q, _, amqp, app, compare, config, doWork, dropbox, gitRunner, loadRabbit, loadUserData, mkdirp, models, mongoose, phantom, port, q, rabbitMQ, setupError, setupWorker, spawn, uuid, winston;

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

spawn = require('child_process').spawn;

console.log(config);

models = require("./utils/schema").models;

app = require("./tasks/phantom");

compare = require("./tasks/compare");

gitRunner = require("./tasks/git");

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
  var body, commit, e, logEntry, mkSSDir, ssDir;
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
  commit = '';
  logEntry = new models.log();
  return loadUserData(app, body.sender.login).then(function(app) {
    var gitConfig, type, username;
    commit = body.head_commit.id;
    logEntry.commit = commit;
    logEntry.repo = body.repository.full_name;
    logEntry.request = msg.content;
    app.user.repo = body.repository.full_name;
    username = '';
    type = '';
    if (typeof body.organization !== 'undefined') {
      username = body.organization.login;
      type = 'org';
    } else {
      username = body.repository.owner.login;
      type = 'user';
    }
    gitConfig = {
      owner: username,
      ghkey: app.user.accessToken,
      repo: body.repository.full_name,
      type: type,
      commit: commit
    };
    return gitRunner.gitClone(gitConfig).then(gitRunner.gitReset).then(gitRunner.gitPull);
  }).then(function(gitConfig) {
    console.log(config);
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
        winston.log('verbose', 'updating log with user');
        logEntry.user = app.user;
        winston.log('verbose', 'cleaning up images');
        app.user.images.sort(function(a, b) {
          if (a.createdAt < b.createdAt) {
            1;
          }
          if (b.createdAt < a.createdAt) {
            -1;
          }
          return 0;
        });
        winston.log('verbose', 'building keys');
        keys = [];
        _.each(app.user.images, function(img) {
          if (keys.indexOf(img.commit) <= -1) {
            return keys.push(img.commit);
          }
        });
        console.log('verbose', 'slicing images');
        if (keys.length >= 3) {
          keys = keys.slice(1, 3);
        }
        app.user.images = _.filter(app.user.images, function(img) {
          return keys.indexOf(img.commit) > -1;
        });
        winston.log('verbose', 'saving images in mongo');
        app.user.save(function(err) {
          if (err) {
            deferred.reject(err);
          }
          winston.log('verbose', 'saved image in mongo');
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
        return logEntry.message = err;
      }).done(function() {
        var child, err, nChild;
        winston.log('info', 'cleanup');
        winston.log('verbose', 'deleting screenshots');
        nChild = spawn('rm', ['-rf', 'screenshots']);
        err = null;
        nChild.stderr.on('data', function(data) {
          err = new Error('' + data);
          winston.error(err);
          if (logEntry.status !== "error") {
            logEntry.status = "error";
            return logEntry.message = err;
          }
        });
        nChild.on('close', function(code) {
          return winston.log('verbose', 'deleting screenshots code: %s', code);
        });
        winston.log('verbose', 'deleting git code');
        child = spawn('rm', ['-rf', 'public/tremble']);
        err = null;
        child.stderr.on('data', function(data) {
          err = new Error('' + data);
          winston.error(err);
          if (logEntry.status !== "error") {
            logEntry.status = "error";
            return logEntry.message = err;
          }
        });
        return child.on('close', function(code) {
          winston.log('verbose', 'deleting git code code: %s', code);
          return logEntry.save(function(err) {
            return winston.error(err);
          });
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
