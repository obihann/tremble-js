winston = require 'winston'

winston.level = process.env.WINSTON_LEVEL

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

  app.get '/logout',
  (req, res) ->
    winston.log 'info', 'GET /logout'
    req.logout()
    res.redirect '/'

  app.get '/auth/github',
  passport.strategies.github,
  passport.passport.authenticate('github', {scope: [ 'user:email' ]})

  app.get '/auth/github/callback',
  passport.strategies.github,
  passport.passport.authenticate('github', {scope: [ 'user:email' ]}),
  (req, res) ->
    winston.log 'info', 'GET /auth/github/callback'
    res.redirect '/profile'

  app.get '/auth/dropbox',
  passport.strategies.dropbox,
  passport.passport.authenticate('dropbox-oauth2')

  app.get '/auth/dropbox/callback',
  passport.strategies.dropbox,
  passport.passport.authenticate('dropbox-oauth2'),
  (req, res) ->
    winston.log 'info', 'GET /auth/dropbox/callback'
    res.redirect '/profile'

  app.post '/hook',
  (req, res) ->
    winston.log 'info', 'POST /hook'
    trembleWeb.ch.assertQueue trembleWeb.q
    trembleWeb.ch.sendToQueue trembleWeb.q, new Buffer("test")
    res.sendStatus  201
