winston = require 'winston'

winston.level = process.env.WINSTON_LEVEL

module.exports = (trembleWeb, passport) ->
  app = trembleWeb.app

  app.get '/', (req, res) ->
    res.render 'index'

  app.get '/logout',
  (req, res) ->
    winston.log 'info', 'GET /logout'
    req.logout()
    res.redirect '/'

  app.get '/auth/github',
  passport.authenticate('github', {scope: [ 'user:email' ]})

  app.get '/auth/github/callback',
  passport.authenticate('github', {scope: [ 'user:email' ]}),
  (req, res) ->
    winston.log 'info', 'GET /auth/github/callback'
    res.render 'profile'

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
