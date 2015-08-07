winston = require 'winston'

winston.level = process.env.WINSTON_LEVEL

module.exports = (trembleWeb, passport) ->
  trembleWeb.app.get '/logout',
  (req, res) ->
    winston.log 'info', 'GET /logout'
    req.logout()
    res.redirect '/'

  trembleWeb.app.get '/auth/github',
  passport.strategies.github,
  passport.passport.authenticate('github', {scope: [ 'user:email' ]})

  trembleWeb.app.get '/auth/github/callback',
  passport.strategies.github,
  passport.passport.authenticate('github', {scope: [ 'user:email' ]}),
  (req, res) ->
    winston.log 'info', 'GET /auth/github/callback'
    res.redirect '/profile'

  trembleWeb.app.get '/auth/dropbox',
  passport.strategies.dropbox,
  passport.passport.authenticate('dropbox-oauth2')

  trembleWeb.app.get '/auth/dropbox/callback',
  passport.strategies.dropbox,
  passport.passport.authenticate('dropbox-oauth2'),
  (req, res) ->
    winston.log 'info', 'GET /auth/dropbox/callback'
    res.redirect '/profile'
