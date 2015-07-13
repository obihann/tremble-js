var Q = require('q');
var fs = require('fs');
var phantom = require('phantom');
var uuid = require('uuid');
var assert = require('assert');
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
            fs.rmdir(commit);
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

              tremble.setRes(conf).then(function(conf) {
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
});
