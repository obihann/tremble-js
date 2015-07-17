winston = require 'winston'
_ = require 'lodash'
Q = require 'q'
express = require 'express'
app = express()
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
    winston.log 'info', 'connecting ot rabbitMQ'
    return amqp.connect rabbitMQ
    .then trembleWeb.createChannel
    .then (ch) ->
      ok = ch.assertQueue q,
        durable: true

      trembleWeb.ch = ch
    .catch (err) ->
      trembleWeb.setupError err

  createChannel: (conn) ->
    winston.log "info", "creating channel"
    return conn.createChannel()

  setupError: (err) ->
    winston.error err
    process.exit 1

app.post '/hook', (req, res) ->
  winston.log 'info', 'POST /hook'
  trembleWeb.ch.assertQueue q
  trembleWeb.ch.sendToQueue "tremble.queue", new Buffer("test")
  res.sendStatus  201

trembleWeb.startup().catch (err) ->
  trembleWeb.setupError err

app.listen port, ->
  winston.log 'info', 'TrembleJS listening at %s', port

module.exports = trembleWeb
