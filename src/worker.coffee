winston = require('winston')
Q = require('q')
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
    winston.log 'verbose', 'setting viewport to %sx%s', config.res.width, config.res.height

    size =
      width: config.res.width
      height: config.res.height

    config.page.set 'viewportSize', size, (status) ->
      if status.height == size.height && status.width == status.width
        winston.log 'verbose', 'viewport size now %sx%s', config.res.width, config.res.height
        deferred.resolve config
      else
        deferred.reject status

    return deferred.promise

  open: (config) ->
    deferred = Q.defer()
    winston.log 'verbose', 'opening %s', config.route_name

    # todo: this should return status and be tested
    config.page.open config.host + ':' + config.port + '/' + config.route, (status) ->
      if status == 'success'
        setTimeout(() ->
          winston.log 'verbose', '%s, now open %s', config.route, status

          deferred.resolve config
        , config.delay)
      else
        deferred.reject status

    return deferred.promise

  process: (config) ->
    deferred = Q.defer()

    mkdirp config.commit, (err) ->
      winston.log 'verbose', 'mkdir %s', config.commit

      config.ph.createPage (page) ->
        config.page = page
        deferred.resolve config

    return deferred.promise

module.exports = app
