var Q, amqp, q, rabbitMQ, request, trembleWeb;

Q = require('q');

amqp = require('amqplib');

request = require('supertest-as-promised');

rabbitMQ = process.env.RABBITMQ_BIGWIG_URL;

q = process.env.RABBITMQ_QUEUE;

trembleWeb = require('../bin/web.js').app;

after(function(done) {
  return amqp.connect(rabbitMQ).then(function(conn) {
    return conn.createChannel();
  }).then(function(ch) {
    return ch.deleteQueue(q);
  }).then(function() {
    return done();
  })["catch"](function(err) {
    return done(err);
  });
});

describe('Routes', function() {
  describe('GET /', function() {
    return it('check default route', function(done) {
      return request(trembleWeb).get('/').expect(200).then(function(res) {
        return done();
      });
    });
  });
  return describe('POST /hook', function() {
    return it('checks post route', function(done) {
      return request(trembleWeb).post('/hook').expect(201).then(function(res) {
        return done();
      });
    });
  });
});
