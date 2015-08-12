fs = require 'fs'
winston = require 'winston'
Q = require 'q'
mkdirp = require 'mkdirp'
_ = require 'lodash'
gm = require 'gm'

winston.level = process.env.WINSTON_LEVEL

app =
  saveToDisk: (user) ->
    winston.log 'info', 'compare.saveToDisk'

    Q.all _.map user.images, (img) ->
      deferred = Q.defer()

      mkdirp 'screenshots/' + img.commit, (err) ->
        deferred.reject err if err
    
      buffer = new Buffer img.data, 'base64'

      fs.writeFile 'screenshots/' + img.filename, buffer, (err) ->
        deferred.reject "unable to save image" if err
        winston.log 'verbose', 'file %s saved to filesystem', img.filename
        deferred.resolve user
      
      deferred.promise
    .then () ->
      return user

  compare: (user) ->
    return user if user.images.length < 2

    winston.log 'info', 'compare.compare'

    keys = []
    images = [[],[]]

    _.all user.images, (img) ->
      if keys.indexOf(img.commit) <= -1
        keys.push img.commit

    _.all user.images, (img) ->
      if img.commit == keys[0]
        images[0].push img
      else
        images[1].push img

    Q.all _.map images[0], (img, key) ->
      deferred = Q.defer()
      leftImg = 'screenshots/' + img.filename
      rightImgObj = _.find images[1], (rImg) ->
        leftSlash = (img.filename.indexOf '/') + 1
        rightSlash = (rImg.filename.indexOf '/') + 1

        cLeft = img.filename.substring leftSlash, img.filename.length
        cRight = rImg.filename.substring rightSlash, rImg.filename.length
        return rImg if cLeft == cRight

      rightImg =  'screenshots/' + rightImgObj.filename
      gmOpts =
        tolerance: 0

      user.newResults = []
      user.results = [] if typeof user.results == 'undefined'

      gm.compare leftImg, rightImg, gmOpts, (err, isEqual, equality) ->
        winston.error err if err
        winston.log 'info', 'comparison of %s, and %s', leftImg, rightImg
        winston.log 'info', 'results: %s', leftImg, rightImg, isEqual
        resultObj =
          repo: user.repo
          left: img.filename
          leftCommit: img.commit
          right: rightImgObj.filename
          rightCommit: rightImgObj.commit
          status: isEqual

        user.newResults.push resultObj
        user.results.push resultObj

        deferred.resolve user

      deferred.promise
    .then () ->
      return user

module.exports = app
