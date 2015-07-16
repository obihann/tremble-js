winston = require 'winston'
_ = require 'lodash'
Q = require 'q'
phantom = require 'phantom'
uuid = require 'uuid'
express = require 'express'
app = express()
tremble = require './worker'
config = require './tremble'
amqp = require 'amqplib'

winston.level = process.env.WINSTON_LEVEL
port = process.env.PORT or 3002
console.log port
rabbitMQ = process.env.RABBITMQ_BIGWIG_URL
q = "tremble.queue"
app.use express.static 'site'

trembleWeb =
  app: app

  startup: ->
    return amqp.connect rabbitMQ
    .then trembleWeb.createChannel
    .then (ch) ->
      trembleWeb.ch = ch
    .catch (err) ->
      trembleWeb.setupError err

  createChannel: (conn) ->
    winston.log "verbose", "creating channel"
    return conn.createChannel()

  setupError: (err) ->
    winston.error err
    process.exit 1

app.post '/hook', (req, res) ->
  trembleWeb.ch.assertQueue q
  trembleWeb.ch.sendToQueue "gms.queue", new Buffer("test")
  res.sendStatus  201

trembleWeb.startup().catch (err) ->
  trembleWeb.setupError err

app.listen port, ->
  winston.log 'info', 'TrembleJS listening at %s', port

module.exports = trembleWeb
