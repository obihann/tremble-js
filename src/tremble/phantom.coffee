winston = require 'winston'
Q = require 'q'
mkdirp = require 'mkdirp'
_ = require 'lodash'
phantom = require 'phantom'
uuid = require 'uuid'
dropbox = require 'dropbox'

winston.level = process.env.WINSTON_LEVEL

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

    # todo: store file in dropbox
    # store latest file in mongo for quick display on user profile
    # this.dropbox.writefile

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

module.exports = app
