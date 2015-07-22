winston = require 'winston'

winston.level = process.env.WINSTON_LEVEL

module.exports = (trembleWeb, passport) ->
  app = trembleWeb.app

  app.get '/logout',
  (req, res) ->
    winston.log 'info', 'GET /logout'
    req.logout()
    res.redirect '/'

  app.get '/auth/github',
  passport.authenticate('github')

  app.get '/auth/github/callback',
  passport.authenticate('github'),
  (req, res) ->
    winston.log 'info', 'GET /auth/github/callback'
    res.redirect '/'

  #app.get '/auth/dropbox', passport.authenticate('dropbox-oauth2')

  #app.get '/auth/dropbox/callback',
    #passport.authenticate 'dropbox-oauth2',
    #{ failureRedirect: '/login' }
    #, (req, res) ->
      #res.redirect('/')

  app.post '/hook',
  (req, res) ->
    winston.log 'info', 'POST /hook'
    trembleWeb.ch.assertQueue trembleWeb.q
    trembleWeb.ch.sendToQueue "tremble.queue", new Buffer("test")
    res.sendStatus  201
