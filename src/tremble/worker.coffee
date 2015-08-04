winston = require('winston')
Q = require('q')
amqp = require('amqplib')
mkdirp = require('mkdirp')
_ = require('lodash')
phantom = require 'phantom'
uuid = require 'uuid'
config = require './tremble'

winston.level = process.env.WINSTON_LEVEL
port = process.env.PORT or 3002
rabbitMQ = process.env.RABBITMQ_BIGWIG_URL
q = process.env.RABBITMQ_QUEUE

app =
  capture: (config) ->
    winston.log 'info', 'app.capture'
    deferred = Q.defer()

    filename = 'screenshot/' + config.commit + '/' + config.route_name + '.'
    filename += config.res.width + '-' + config.res.height + '.png'
    winston.log 'verbose', 'rendering %s', filename

    config.page.render filename, ->
      winston.log 'verbose', 'render of %s complete', filename
      deferred.resolve config

    return deferred.promise

  setRes: (config) ->
    winston.log 'info', 'app.setRes'
    deferred = Q.defer()
    winston.log 'verbose', 'setting viewport to %sx%s',
    config.res.width, config.res.height

    size =
      width: config.res.width
      height: config.res.height

    config.page.set 'viewportSize', size, (status) ->
      if status.height == size.height && status.width == status.width
        winston.log 'verbose', 'viewport size now %sx%s',
        config.res.width, config.res.height
        deferred.resolve config
      else
        winston.error status
        deferred.reject status

    return deferred.promise

  open: (config) ->
    winston.log 'info', 'app.open'
    deferred = Q.defer()
    winston.log 'verbose', 'opening %s', config.route_name

    # todo: this should return status and be tested
    pagePath = config.host + ':' + config.port + '/tremble/' + config.route
    config.page.open pagePath, (status) ->
      if status == 'success'
        setTimeout(() ->
          winston.log 'verbose', '%s, now open %s', config.route, status

          deferred.resolve config
        , config.delay)
      else
        winston.error status
        deferred.reject status

    return deferred.promise

  process: (config) ->
    winston.log 'info', 'app.process'
    deferred = Q.defer()

    mkdirp 'screenshot/' + config.commit, (err) ->
      if err == null
        winston.log 'verbose', 'mkdir %s', config.commit

        config.ph.createPage (page) ->
          config.page = page
          deferred.resolve config
      else
        winston.error err
        deferred.reject err

    return deferred.promise

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

setupWorker = (ch) ->
  winston.log 'info', 'asserting channel %s', q
  ok = ch.assertQueue q,
    durable: true

  ok = ok.then ->
    ch.prefetch 1

  ok = ok.then ->
    ch.consume q, doWork, noAck: false

  ok

winston.log 'info', 'connecting to rabbitMQ %s', rabbitMQ
amqp.connect rabbitMQ
.then (conn) ->
  winston.log 'info', 'creating channel'
  conn.createChannel()
.then (ch) ->
  winston.log 'info', 'setting up worker'
  setupWorker ch
.catch (err) ->
  setupError err

module.exports = app
