fs = require 'fs'
winston = require 'winston'
Q = require 'q'
mkdirp = require 'mkdirp'
_ = require 'lodash'
phantom = require 'phantom'

winston.level = process.env.WINSTON_LEVEL

app =
  capture: (config) ->
    winston.log 'info', 'app.capture'
    deferred = Q.defer()

    filename = 'screenshots/' + config.commit + '/' + config.route_name + '.'
    filename += config.res.width + '-' + config.res.height + '.png'
    winston.log 'verbose', 'rendering %s', filename

    config.page.renderBase64 'PNG', (dataString) ->
      winston.log 'verbose', 'render of %s complete', filename
      buffer = new Buffer dataString, 'base64'

      config.dataString = dataString
      config.imageBuffer = buffer

      # this should be a seperate step that saves both the
      # current and last set of images to disk for comparison
      fs.writeFile filename, buffer, (err) ->
        deferred.reject "unable to save image" if err
        winston.log 'verbose', 'file %s saved to filesystem', filename

        deferred.resolve config

    return deferred.promise

  saveDatabase: (config) ->
    winston.log 'info', 'app.saveDatabasex'
    deferred = Q.defer()

    filename = 'Apps/tremble-js/screenshots/'
    filename += config.commit + '/' + config.route_name + '.'
    filename += config.res.width + '-' + config.res.height + '.png'

    # todo: @obihann ensure we only have two sets of images

    imagesArr = app.user.images
    imageObj =
      filename: config.res.width + '-' + config.res.height + '.png'
      dropbox: filename
      commit: config.commit
      data: config.dataString

    imagesArr.push imageObj

    app.user.images = imagesArr
    app.user.save (err) ->
      deferred.reject err if err
      winston.log 'info', 'saved image in mongo'
      deferred.resolve config

    return deferred.promise

  saveDropbox: (config) ->
    winston.log 'info', 'app.saveDropbox'
    deferred = Q.defer()

    filename = 'Apps/tremble-js/screenshots/'
    filename += config.commit + '/' + config.route_name + '.'
    filename += config.res.width + '-' + config.res.height + '.png'

    app.dropbox.writeFile filename, config.buffer, (err, stat) ->
      deferred.reject "unable to save image to dropbox" if err
      winston.log 'verbose', 'file %s saved to dropbox', filename
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

    mkdirp 'screenshots/' + config.commit, (err) ->
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
