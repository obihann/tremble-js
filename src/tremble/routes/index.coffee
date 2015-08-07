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
        keys = []
        images = [[],[]]

        Q.all _.map req.user.images, (img) ->
          if keys.indexOf(img.commit)<= -1
            keys.push img.commit
        .then ->
          Q.all _.map req.user.images, (img) ->
            if img.commit == keys[0]
              images[0].push img
            else
              images[1].push img
        .done ->
          opts =
            commitA: keys[0]
            commitB: keys[1]
            imagesA: images[0]
            imagesB: images[1]

          res.render 'profile', opts

  require('./auth') trembleWeb, passport
  require('./hooks') trembleWeb
