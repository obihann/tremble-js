Q = require('q')
mkdirp = require('mkdirp')
_ = require('lodash')

app =
  capture: (config) ->
    deferred = Q.defer()

    filename = config.commit + '/index.'
    filename += config.res.width + '-' + config.res.height + '.png'
    console.log 'rendering %s', filename

    config.page.render filename, ->
      console.log "render of %s complete", filename
      deferred.resolve config

    return deferred.promise

  setRes: (config) ->
    deferred = Q.defer()
    console.log 'setting viewport to %sx%s', config.res.width, config.res.height

    size =
      width: config.res.width
      height: config.res.height

    config.page.set 'viewportSize', size, ->
      console.log 'viewport size now %sx%s', config.res.width, config.res.height
      deferred.resolve config

    return deferred.promise

  open: (config) ->
    deferred = Q.defer()
    console.log 'opening %s', 'index'

    config.page.open 'http://localhost:' + config.port, () ->
      setTimeout(() ->
        console.log("%s, now open", "index.html")

        deferred.resolve config
      , 3000)

    return deferred.promise

  process: (config) ->
    deferred = Q.defer()

    mkdirp config.commit, (err) ->
      console.log 'mkdir %s', config.commit

      config.ph.createPage (page) ->
        config.page = page
        deferred.resolve config

    return deferred.promise

module.exports = app
