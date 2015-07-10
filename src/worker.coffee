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
    console.log 'setting viewport to %s%s', res.width, res.height
    page.set 'viewportSize', {
      width: res.width
      height: res.height
    }, (err) ->
      console.log 'opening %s', 'index'
      page.open 'http://localhost:' + port, ->
        filename = commit + '/index.' + res.width + '-' + res.height + '.png'
        console.log 'rendering %s', filename
        page.render filename, ->
          deferred.resolve()
          return
        return
      return
    deferred.promise
  process: ->
    mkdirp commit, (err) ->
      console.log 'mkdir %s', commit
      phantom.create (ph) ->
        ph.createPage (page) ->
          # instead of _.each or _.mmap what about a queue?
          Q.allSettled(_.map(config.resolutions, (res) ->
            app.capture page, res
          )).then ->
            console.log 'Shutting down phantom'
            ph.exit()
            return
          return
        return
      return
    return

module.export = app
app.process()
