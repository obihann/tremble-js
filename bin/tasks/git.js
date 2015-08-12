var Q, app, childExit, git, spawn, winston;

winston = require('winston');

Q = require('q');

spawn = require('child_process').spawn;

git = 'git';

winston.level = process.env.WINSTON_LEVEL;

childExit = function(deferred, code, config, err) {
  if (code !== 0) {
    if (typeof err !== 'undefined') {
      return deferred.reject(err);
    } else {
      err = new Error('child process failed response expected 0 actual ' + code);
      return deferred.reject(err);
    }
  } else {
    return deferred.resolve(config);
  }
};

app = {
  gitClone: function(config) {
    var child, deferred, err;
    winston.log('info', 'git.gitClone');
    deferred = Q.defer();
    child = spawn(git, ['clone', 'https://' + config.ghkey + '@github.com/' + config.repo + '.git', 'public/tremble']);
    err = null;
    child.stderr.on('data', function(data) {
      return err = new Error('' + data);
    });
    child.on('close', function(code) {
      return childExit(deferred, code, config, err);
    });
    return deferred.promise;
  },
  gitReset: function(config) {
    var child, deferred, err;
    winston.log('info', 'git.gitReset');
    deferred = Q.defer();
    child = spawn(git, ['reset', '--hard', config.commit], {
      cwd: 'public/tremble'
    });
    err = null;
    child.stderr.on('data', function(data) {
      return err = new Error('' + data);
    });
    child.on('close', function(code) {
      return childExit(deferred, code, config, err);
    });
    return deferred.promise;
  },
  gitPull: function(config) {
    var child, deferred, err;
    winston.log('info', 'git.gitPull');
    deferred = Q.defer();
    child = spawn(git, ['pull'], {
      cwd: 'public/tremble'
    });
    err = null;
    child.stderr.on('data', function(data) {
      return err = new Error('' + data);
    });
    child.on('close', function(code) {
      return childExit(deferred, code, config, err);
    });
    return deferred.promise;
  }
};

module.exports = app;
