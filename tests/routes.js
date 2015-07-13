Q = require('q');
var uuid = require('uuid');
var assert = require('assert');
var should = require('should');
var request = require('superagent');
var app = require('../tremble/web.js');
var tremble = require('../tremble/worker');

var port = process.env.PORT || 3002;
var url = "http://localhost:" + port;

describe('Routes', function() {
  describe('GET /', function() {
    it('check default route', function(done) {
      request
      .get(url + '/')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        done();
      });
    });
  });
  
  describe('POST /hook', function() {
    this.timeout(10000);
    it('check default route', function(done) {
      request
      .post(url + '/hook')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        done();
      });
    });
  });
});
