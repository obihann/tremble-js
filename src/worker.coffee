Q = require('q')
mkdirp = require('mkdirp')
uuid = require('uuid')
phantom = require('phantom')
_ = require('lodash')
commit = uuid.v4()
config = require('./tremble')

port = process.env.PORT or 3002

app =
  capture: (page, res) ->
    deferred = Q.defer()

    filename = commit + '/index.' + res.width + '-' + res.height + '.png'
    console.log 'rendering %s', filename

    page.render filename, ->
      console.log "render of %s complete", filename
      deferred.resolve()

    return deferred.promise

  setRes: (page, res) ->
    deferred = Q.defer()
    console.log 'setting viewport to %s%s', res.width, res.height

    size =
      width: res.width
      height: res.height

    page.set 'viewportSize', size, ->
      console.log 'viewport size now %sx%s', res.width, res.height
      deferred.resolve()

    return deferred.promise

  open: (page) ->
    deferred = Q.defer()
    console.log 'opening %s', 'index'

    page.open 'http://localhost:' + port, () ->
      console.log("%s, now open", "index.html")
      deferred.resolve()

    return deferred.promise

  process: (ph) ->
    mkdirp commit, (err) ->
      console.log 'mkdir %s', commit

      ph.createPage (page) ->
        app.open(page).then () ->
          Q.all(_.map(config.resolutions, (res) ->
            app.setRes(page, res)
            .then app.capture(page, res)
        )).done ->
          console.log 'Shutting down phantom'
          ph.exit()

module.export = app
phantom.create (ph) ->
  app.process ph
