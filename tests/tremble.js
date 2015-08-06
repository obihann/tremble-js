var Q, assert, chai, chaiAsPromised, commit, dropbox, fs, gm, mkdirp, options, phantom, port, request, tremble, trembleWeb, url, uuid;

Q = require('q');

fs = require('fs');

mkdirp = require('mkdirp');

gm = require('gm');

phantom = require('phantom');

uuid = require('uuid');

chai = require("chai");

assert = require('chai').assert;

chaiAsPromised = require('chai-as-promised');

request = require('supertest-as-promised');

dropbox = require('dropbox');

trembleWeb = require('../bin/web.js').app;

tremble = require('../bin/phantom');

chai.use(chaiAsPromised);

port = process.env.PORT || 3002;

url = 'http://localhost:' + port;

commit = uuid.v4();

options = {
  host: 'http://localhost',
  route_name: 'index',
  route: 'index.html',
  delay: 2000,
  port: port,
  commit: commit,
  res: {
    width: 1680,
    height: 1050
  }
};

beforeEach(function(done) {
  options.res = {
    width: 1680,
    height: 1050
  };
  return done();
});

before(function(done) {
  var client, e, mkSSDir, setupPage, ssDir;
  client = new dropbox.Client({
    key: process.env.DROPBOX_KEY,
    secret: process.env.DROPBOX_SECRET,
    sandbox: true,
    token: process.env.DROPBOX_TOKEN
  });
  client.authDriver(new dropbox.AuthDriver.NodeServer(8191));
  tremble.dropbox = client;
  mkSSDir = function(done) {
    return mkdirp('screenshots', function(err) {
      if (err === null) {
        return done(err);
      }
    });
  };
  setupPage = function() {
    options.pagePath = options.host + ':' + options.port + '/tremble/';
    return phantom.create(function(ph) {
      options.ph = ph;
      return done();
    });
  };
  try {
    ssDir = fs.lstatSync('screenshots');
    if (ssDir.isDirectory()) {
      return setupPage();
    } else {
      return mkSSDir(setupPage);
    }
  } catch (_error) {
    e = _error;
    return mkSSDir(setupPage);
  }
});

after(function(done) {
  if (typeof options.page !== 'undefined') {
    options.page.close();
  }
  if (typeof options.ph !== 'undefined') {
    options.ph.exit();
  }
  fs.unlinkSync('screenshots/' + commit + '/index.1680-1050.png');
  fs.rmdir('screenshots/' + commit);
  return done();
});

describe('TrembleJS', function() {
  describe('worker.process', function() {
    return it('should make a new directory and create a new phantonjs page', function(done) {
      return tremble.process(options).then(function(config) {
        var stats;
        stats = fs.lstatSync('screenshots/' + commit);
        assert.equal(stats.isDirectory(), true, 'directory exists');
        return assert.isDefined(stats, 'directory stats are defined');
      }).then(function() {
        return done();
      })["catch"](function(err) {
        return done(err);
      });
    });
  });
  describe('worker.open', function() {
    return it('should render index.html', function(done) {
      this.timeout(4000);
      return options.ph.createPage(function(page) {
        options.page = page;
        return tremble.open(options).then(function(config) {
          return config.page.evaluate(function() {
            return document.title;
          }, function(result) {
            return assert.equal(result, 'Git Mirror Sync');
          });
        }).then(function() {
          return done();
        })["catch"](function(err) {
          return done(err);
        });
      });
    });
  });
  describe('worker.setres', function() {
    it('fail when setting the resolution of the viewport to dogxcat', function(done) {
      options.pagePath += options.route;
      return options.page.open(options.pagePath, function(status) {
        if (status !== 'success') {
          done(status);
        }
        options.res = {
          width: 'dog',
          height: 'cat'
        };
        return tremble.setRes(options).then(function(conf) {
          return done(Error('resolution should not be set to an invalid type'));
        })["catch"](function(err) {
          assert.equal(err.height, 300);
          assert.equal(err.width, 400);
          return done();
        });
      });
    });
    return it('set the resolution of the viewport to 1680x1050', function(done) {
      return options.page.open(options.pagePath, function(status) {
        if (status !== 'success') {
          done(status);
        }
        return tremble.setRes(options).then(function(conf) {
          return done();
        })["catch"](function(err) {
          return done(err);
        });
      });
    });
  });
  return describe('worker.capture', function() {
    it('should render an image of the site', function(done) {
      this.timeout(4000);
      return options.page.open(options.pagePath, function(status) {
        if (status !== 'success') {
          done(status);
        }
        return tremble.capture(options).then(function(conf) {
          var deferred;
          deferred = Q.defer();
          fs.readdir('screenshots/' + conf.commit, function(err, files) {
            if (err) {
              deferred.reject(err);
            }
            return deferred.resolve(files);
          });
          return deferred.promise;
        }).then(function(files) {
          if (files.indexOf('index.1680-1050.png') > -1) {
            return done();
          } else {
            return assert.fail(files, 'index.1680-1050.png');
          }
        })["catch"](function(err) {
          return done(err);
        });
      });
    });
    return it('rendered images should match the sample image', function(done) {
      var newImg, sampleImg;
      newImg = 'screenshots/' + options.commit + '/index.1680-1050.png';
      sampleImg = 'tests/sample-capture/index.1680-1050.png';
      options = {
        tolerance: 0.1
      };
      return gm.compare(newImg, sampleImg, options, function(err, isEqual, equality) {
        if (err) {
          done(err);
        }
        assert.equal(isEqual, true);
        return done();
      });
    });
  });
});
