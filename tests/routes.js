var Q, app, assert, port, request, should, tremble, url, uuid;

Q = require('q');

uuid = require('uuid');

assert = require('assert');

should = require('should');

request = require('superagent');

app = require('../tremble/web.js');

tremble = require('../tremble/worker');

port = process.env.PORT || 3002;

url = "http://localhost:" + port;

describe('Routes', function() {
  describe('GET /', function() {
    return it('check default route', function(done) {
      return request.get(url + '/').end(function(err, res) {
        assert.equal(res.status, 200);
        return done();
      });
    });
  });
  return describe('POST /hook', function() {
    this.timeout(10000);
    return it('check default route', function(done) {
      return request.post(url + '/hook').end(function(err, res) {
        assert.equal(res.status, 200);
        return done();
      });
    });
  });
});
