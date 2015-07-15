winston = require('winston')
Q = require('q')
amqp = require('amqplib')
mkdirp = require('mkdirp')
_ = require('lodash')

app =
  capture: (config) ->

    deferred = Q.defer()

    filename = config.commit + '/' + config.route_name + '.'
    filename += config.res.width + '-' + config.res.height + '.png'
    winston.log 'verbose', 'rendering %s', filename

    config.page.render filename, ->
      winston.log 'verbose', 'render of %s complete', filename
      deferred.resolve config

    return deferred.promise

  setRes: (config) ->
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
    deferred = Q.defer()
    winston.log 'verbose', 'opening %s', config.route_name

    # todo: this should return status and be tested
    pagePath = config.host + ':' + config.port + '/' + config.route
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
    deferred = Q.defer()

    mkdirp config.commit, (err) ->
      if err == null
        winston.log 'verbose', 'mkdir %s', config.commit

        config.ph.createPage (page) ->
          config.page = page
          deferred.resolve config
      else
        winston.error err
        deferred.reject err

    return deferred.promise

module.exports = app

amqp.connect process.env.RABBITMQ_BIGWIG_URL, (err, conn) ->
  conn.createChannel().then (ch) ->
    ch.assertQueue 'tremble.queue'

    ch.consume q, (msg) ->
      phantom.create (ph) ->
        console.log 'Starting phantom'
        commit =  uuid.v4()

        Q.all(_.map(config.resolutions, (res) ->
          config =
            ph: ph
            commit: commit
            res: res

          app.process config
          .then app.open
          .then app.setRes
          .then app.capture
        )).done ->
          console.log 'Shutting down phantom'
          ph.exit()

        ok = ok.then(->
          ch.prefetch 1
        )

        ok = ok.then(->
          ch.consume 'tremble.queue', doWork, noAck: false
        )

    ok
