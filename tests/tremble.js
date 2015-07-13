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

describe('TrembleJS', function() {
  describe('worker.process', function(){
    it('should make a new directory and create a new phantonjs page', function(done) {
        phantom.create(function(ph) {
          var conf = {
            host: 'http://localhost',
            route_name: 'index',
            route: 'index.html',
            delay: 3000,
            port: port,
            ph: ph,
            commit: commit,
            res: {
              width: 1680,
              height: 1050
            }
          };

          tremble.process(conf).done(function() {
            var stats = fs.lstatSync(commit);
            assert.equal(stats.isDirectory(), true);
            conf.ph.exit();
            fs.rmdir(commit);
            done();
          });
        });
    });

    it('should render index.html', function(done) {
        phantom.create(function(ph) {
          var conf = {
            host: 'http://localhost',
            route_name: 'index',
            route: 'index.html',
            delay: 0,
            port: port,
            ph: ph,
            commit: commit,
            res: {
              width: 1680,
              height: 1050
            }
          };

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
});
