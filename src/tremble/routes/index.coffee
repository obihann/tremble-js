# load npm modules
_ = require 'lodash'
Q = require 'q'

module.exports = (trembleWeb, passport) ->
  app = trembleWeb.app

  app.get '/', (req, res) ->
    if typeof req.user == 'undefined'
      res.render 'index'
    else
      res.redirect '/profile'

  app.get '/profile', (req, res) ->
    if typeof req.user == 'undefined'
      res.redirect '/'
    else
      if typeof req.user.dropbox == 'undefined'
        res.render 'dropbox'
      else
        cleanResults = []

        Q.all _.map req.user.results, (result) ->
          result.cLeftCommit = result.leftCommit.substring(0, 7)
          result.cRightCommit = result.rightCommit.substring(0, 7)

          leftSlash = (result.left.indexOf '/') + 1
          rightSlash = (result.right.indexOf '/') + 1

          result.cLeft = result.left.substring leftSlash, result.left.length
          result.cRight = result.right.substring rightSlash, result.right.length

          matchLevel = 0

          result.leftData = _.find req.user.images, (img) ->
            matchLevel++ if img.filename == result.left
            return img if img.filename == result.left

          result.rightData = _.find req.user.images, (img) ->
            matchLevel++ if img.filename == result.right
            return img if img.filename == result.right

          cleanResults.push result if matchLevel == 2
        .done ->
          opts =
            results: cleanResults

          res.render 'profile', opts

  require('./auth') trembleWeb, passport
  require('./hooks') trembleWeb
