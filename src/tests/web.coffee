# load npm modules
Q = require 'q'
amqp = require('amqplib')
request = require 'supertest-as-promised'

rabbitMQ = process.env.RABBITMQ_BIGWIG_URL
q = process.env.RABBITMQ_QUEUE

# load local modules
trembleWeb = require('../bin/web.js').app

after (done) ->
  amqp.connect rabbitMQ
  .then (conn) ->
    conn.createChannel()
  .then (ch) ->
    ch.deleteQueue q
  .then () ->
    done()
  .catch (err) ->
    done err

# route tests
describe 'Routes', ->
  describe 'GET /', ->
    it 'check default route', (done) ->
      request trembleWeb
        .get '/'
        .expect 200
        .then (res) ->
          done()
  
  describe 'POST /hook', () ->
    it 'checks post route', (done) ->
      request trembleWeb
        .post '/hook'
        .expect 201
        .then (res) ->
          done()
