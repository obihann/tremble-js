winston = require 'winston'
Q = require 'q'
amqp = require 'amqplib'
mkdirp = require 'mkdirp'
_ = require 'lodash'
phantom = require 'phantom'
uuid = require 'uuid'
config = require './tremble'
dropbox = require 'dropbox'
mongoose = require('mongoose')

models = require("./schema").models
app = require("./phantom")

winston.level = process.env.WINSTON_LEVEL
port = process.env.PORT or 3002
rabbitMQ = process.env.RABBITMQ_BIGWIG_URL
q = process.env.RABBITMQ_QUEUE
mongoose.connect process.env.MONGO_DB

doWork = ->
  winston.log 'info', 'doWork'

  mkSSDir = () ->
    mkdirp 'screenshot', (err) ->
      if err == null
        winston.log 'verbose', 'mkdir screenshot'

  try
    ssDir = fs.lstatSync 'screenshot'

    if ssDir.isDirectory() != true
      mkSSDir()
  catch e
    mkSSDir()

  phantom.create (ph) ->
    winston.log 'info', 'Starting phantom'
    commit =  uuid.v4()

    Q.all(_.map(config.pages, (page) ->
      Q.all(_.map(config.resolutions, (res) ->
        config =
          host: "http://localhost"
          route_name: page.title
          route: page.path
          delay: config.delay
          port: port
          ph: ph
          commit: commit
          res: res

        app.process config
        .then app.open
        .then app.setRes
        .then app.capture
      ))
    )).done ->
      winston.log 'info', 'Shutting down phantom'
      ph.exit()

setupError = (err) ->
  winston.error err
  process.exit 1

setupWorker = (app) ->
  winston.log 'info', 'setting up worker'
  winston.log 'info', 'asserting channel %s', q
  ok = app.rabbitCH.assertQueue q,
    durable: true

  ok = ok.then ->
    ch.prefetch 1

  ok = ok.then ->
    app.rabbitCH.consume q, doWork, noAck: false

  ok

loadUserData = (app) ->
  # todo: @obihann change this find based on
  # github id obtained from pull request
  winston.log 'info', 'loading user from database'
  models.user.findOne({ _id: '55c110a0fa70af612fb1d844'}).exec()
  .then (user) ->
    app.user = user
    app
  .then (app) ->
    client = new dropbox.Client
      key: process.env.DROPBOX_KEY
      secret: process.env.DROPBOX_SECRET
      sandbox: false
      token: app.user.dropbox.accessToken

    client.authDriver new dropbox.AuthDriver.NodeServer(8191)

    app.dropbox = client
    app
  .then (app) ->
    app.dropbox.getAccountInfo (err, accountInfo) ->
      setupError(err) if err
      winston.verbose "Hello, %s", accountInfo.name

    app
  .then null, (err) ->
    setupError(err) if err
  .end()

loadRabbit = (app) ->
  winston.log 'info', 'connecting to rabbitMQ %s', rabbitMQ
  amqp.connect rabbitMQ
  .then (conn) ->
    winston.log 'info', 'creating channel'
    app.rabbitConn = conn

    conn.createChannel()
  .then (ch) ->
    app.rabbitCH = ch

    app
  .catch (err) ->
    setupError err

loadUserData(app)
  .then(loadRabbit)
  .then(setupWorker)

module.exports = app
