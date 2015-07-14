var Q, app, assert, commit, expect, fs, gm, options, phantom, port, request, should, tremble, url, uuid;

Q = require('q');

fs = require('fs');

gm = require('gm');

phantom = require('phantom');

uuid = require('uuid');

assert = require('assert');

expect = require('expect');

should = require('should');

request = require('superagent');

app = require('../tremble/web.js');

tremble = require('../tremble/worker');

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

after(function() {
  fs.unlinkSync(commit + '/index.1680-1050.png');
  fs.rmdir(commit);
  return options.ph.exit();
});

describe('TrembleJS', function() {
  describe('worker.process', function() {
    return it('should make a new directory and create a new phantonjs page', function(done) {
      return phantom.create(function(ph) {
        options.ph = ph;
        return tremble.process(options).then(function() {
          var stats;
          stats = fs.lstatSync(options.commit);
          assert.equal(stats.isDirectory(), true);
          return done();
        });
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
            assert.equal(result, 'Git Mirror Sync');
            config.ph.exit();
            return done();
          });
        }).fail(function(err) {
          throw err;
        });
      });
    });
  });
  describe('worker.setres', function() {
    it('fail when setting the resolution of the viewport to dogxcat', function(done) {
      var pagePath;
      pagePath = options.host + ':' + options.port + '/' + options.route;
      return options.page.open(pagePath, function(status) {
        if (status !== 'success') {
          throw status;
        }
        options.res = {
          width: 'dog',
          height: 'cat'
        };
        return tremble.setRes(options).then(function(options) {
          throw new Error('resolution should not be set to an invalid type');
        }).fail(function(err) {
          assert.equal(err.height, 300);
          assert.equal(err.width, 400);
          return done();
        });
      });
    });
    return it('set the resolution of the viewport to 1680x1050', function(done) {
      var pagePath;
      pagePath = options.host + ':' + options.port + '/' + options.route;
      return options.page.open(pagePath, function(status) {
        if (status !== 'success') {
          throw status;
        }
        options.res = {
          width: 1680,
          height: 1050
        };
        return tremble.setRes(options).then(function(config) {
          return done();
        }).fail(function(err) {
          throw err;
        });
      });
    });
  });
  return describe('worker.capture', function() {
    return it('should render an image of the site that matches the sample image', function(done) {
      var pagePath;
      pagePath = options.host + ':' + options.port + '/' + options.route;
      return options.page.open(pagePath, function(status) {
        var size;
        if (status !== 'success') {
          throw status;
        }
        size = {
          width: options.res.width,
          height: options.res.height
        };
        return options.page.set('viewportSize', size, function(status) {
          return tremble.capture(options).then(function(config) {
            return fs.readdir(config.commit, function(err, files) {
              var newImg, sampleImg;
              if (err) {
                throw err;
              }
              if (files.indexOf('index.1680-1050.png') > -1) {
                newImg = config.commit + '/index.1680-1050.png';
                sampleImg = 'tests/sample/index.1680-1050.png';
                return gm.compare(newImg, sampleImg, function(err, isEqual) {
                  if (err) {
                    throw err;
                  }
                  assert.equal(isEqual, true);
                  return done();
                });
              } else {
                return assert.fail(files, 'index.1680-1050.png');
              }
            });
          });
        });
      });
    });
  });
});
