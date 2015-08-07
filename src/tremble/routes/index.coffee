module.exports = (trembleWeb, passport) ->
  app = trembleWeb.app

  app.get '/', (req, res) ->
    if typeof req.user == 'undefined'
      res.render 'index'
    else
      res.render 'profile'

  app.get '/profile', (req, res) ->
    if typeof req.user == 'undefined'
      res.redirect '/'
    else
      if typeof req.user.dropbox == 'undefined'
        res.render 'dropbox'
      else
        res.render 'profile'

  require('./auth') app, passport
  require('./hooks') app
