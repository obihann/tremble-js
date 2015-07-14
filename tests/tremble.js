var Q = require('q');
var fs = require('fs');
var gm = require('gm');
var phantom = require('phantom');
var uuid = require('uuid');
var assert = require('assert');
var expect = require('expect');
var should = require('should');
var request = require('superagent');
var app = require('../tremble/web.js');
var tremble = require('../tremble/worker');

var port = process.env.PORT || 3002;
var url = "http://localhost:" + port;
var commit = uuid.v4();
var options = {
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
});

describe('TrembleJS', function() {
  describe('worker.process', function(){
    it('should make a new directory and create a new phantonjs page', function(done) {
      phantom.create(function(ph) {
        var conf = options;
        conf.ph = ph;

        tremble.process(conf).then(function() {
          var stats = fs.lstatSync(commit);
          assert.equal(stats.isDirectory(), true);
          conf.ph.exit();
          done();
        });
      });
    });
  });

  describe('worker.open', function(){
    it('should render index.html', function(done) {
      this.timeout(4000);

      phantom.create(function(ph) {
        var conf = options;
        conf.ph = ph;

        conf.ph.createPage(function(page) {
          conf.page = page;

          tremble.open(conf).then(function(config) {
            config.page.evaluate(function () { return document.title; }, function (result) {
              assert.equal(result, 'Git Mirror Sync');
              config.ph.exit();
              done();
            });
          })
          .fail(function(err) {
            throw err;
          });
        });
      });
    });
  });
  describe('worker.setres', function(){
    it('fail when setting the resolution of the viewport to dogxcat', function(done) {
      phantom.create(function(ph) {
        var conf = options;
        conf.ph = ph;

        conf.ph.createPage(function(page) {
          conf.page = page;

          conf.page.open(conf.host + ':' + conf.port + '/' + conf.route, function (status) {
            if(status !== 'success') {
              throw status;
            }

            conf.res = {
              width: 'dog',
              height: 'cat'
            };

            tremble.setRes(conf).then(function(conf) {
              throw new Error("resolution should not be set to an invalid type");
            })
            .fail(function (err) {
              assert.equal(err.height, 300);
              assert.equal(err.width, 400);
              done();
            });
          });
        });
      });
    });

    it('set the resolution of the viewport to 1680x1050', function(done) {
      phantom.create(function(ph) {
        var conf = options;
        conf.ph = ph;

        conf.ph.createPage(function(page) {
          conf.page = page;

          conf.page.open(conf.host + ':' + conf.port + '/' + conf.route, function (status) {
            if(status !== 'success') {
              throw status;
            }

            conf.res = {
              width: 1680,
              height: 1050
            };

            tremble.setRes(conf).then(function(conf) {
              //assert.equal(err.height, 300);
              //assert.equal(err.width, 400);
              done();
            })
            .fail(function (err) {
              throw err;
            });
          });
        });
      });
    });
  });

  describe('worker.capture', function(){
    it('should render an image of the site that matches the sample image', function(done) {
      phantom.create(function(ph) {
        var conf = options;
        conf.ph = ph;

        conf.ph.createPage(function(page) {
          conf.page = page;

          conf.page.open(conf.host + ':' + conf.port + '/' + conf.route, function (status) {
            if(status !== 'success') {
              throw status;
            }

            var size = {
              width: conf.res.width,
              height: conf.res.height
            };

            conf.page.set('viewportSize', size, function (status) {
              tremble.capture(conf).then(function(conf) {
                fs.readdir(conf.commit, function (err, files) {
                  if (err) {
                    throw err;
                  }

                  if (files.indexOf("index.1680-1050.png") > -1) {
                    gm.compare(conf.commit + '/index.1680-1050.png', 'tests/sample/index.1680-1050.png', function (err, isEqual) {
                      if (err) {
                        throw err;
                      }

                      assert.equal(isEqual, true);
                      done();
                    });
                  } else {
                    assert.fail(files, "index.1680-1050.png");
                  }
                });
              });
            });
          });
        });
      });
    });
  });
});
