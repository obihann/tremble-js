winston = require 'winston'
_ = require 'lodash'
Q = require 'q'
phantom = require 'phantom'
uuid = require 'uuid'
express = require 'express'
app = module.exports = express()
tremble = require './worker'
config = require './tremble'
amqp = require 'amqplib'

winston.level = process.env.WINSTON_LEVEL
port = process.env.PORT or 3002
q = "tremble.queue"
app.use express.static 'site'
rabbitMQ = process.env.RABBITMQ_BIGWIG_URL

loadApp = (conn) ->
  conn.createChannel().then (ch) ->
    app.post '/hook', (req, res) ->
      ch.assertQueue q
      ch.sendToQueue "gms.queue", new Buffer("test")
      res.sendStatus  201

    app.listen port, ->
      winston.log 'info', 'TrembleJS listening at %s', port

setupError = (err) ->
  winston.error err
  process.exit 1

amqp.connect(rabbitMQ).then loadApp, setupError
