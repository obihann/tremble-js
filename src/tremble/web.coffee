# load npm modules
winston = require 'winston'
_ = require 'lodash'
Q = require 'q'
amqp = require 'amqplib'
bodyParser = require 'body-parser'
express = require 'express'
session = require 'express-session'
mongoose = require 'mongoose'
MongoStore = require('connect-mongo')(session)

# load local modules
passport = require './passport'

# setup variables
winston.level = process.env.WINSTON_LEVEL
port = process.env.PORT or 3002
rabbitMQ = process.env.RABBITMQ_BIGWIG_URL
q = "tremble.queue"
app = express()

# setup the enviroment
app.use express.static 'site'
app.use bodyParser.json()
mongoose.connect process.env.MONGO_DB
app.use session(
  store: new MongoStore({ mongooseConnection: mongoose.connection }, (err) ->
    console.log err or 'connect-mongodb setup ok'
    return
)
  secret: 'keyboard cat'
  resave: true
  saveUninitialized: false)
app.use passport.initialize()
app.use passport.session()

# define this module
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

# start the server
trembleWeb.startup()
  .then ->
    trembleWeb.routes = require('./routes')(trembleWeb, passport)
    app.listen port, ->
      winston.log 'info', 'TrembleJS listening at %s', port
  .catch (err) ->
    trembleWeb.setupError err

module.exports = trembleWeb
