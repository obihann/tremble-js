winston = require('winston')
passport = require('passport')
mongoose = require('mongoose')
models = require("./schema").models
GitHubStrategy = require('passport-github2').Strategy
DropboxOAuth2Strategy = require('passport-dropbox-oauth2').Strategy

passport.serializeUser (user, done) ->
  done null, user

passport.deserializeUser (user, done) ->
  done null, user

passportObject =
  passport: passport
  strategies:
    github: (req, res, next) ->
      passport.use new GitHubStrategy({
        clientID: process.env.GH_ID
        clientSecret: process.env.GH_SECRET
        callbackURL: process.env.GH_CALLBACK
      }, (accessToken, refreshToken, profile, done) ->
        models.user.findOne { githubId: profile.id }, (err, user) ->
          if err
            winston.log 'error', err
            return done(err)
          if !user
            user = new (models.user)(
              githubId: profile.id
              displayName: profile.displayName
              username: profile.username
              accessToken: accessToken
              createdAt: Date.now())
            user.save (err) ->
              if err
                done err
              else
                done null, user
          else
            return done(null, user)
          return
        return
      )

      next()
    dropbox: (req, res, next) ->
      passport.use new DropboxOAuth2Strategy({
        clientID: process.env.DROPBOX_KEY
        clientSecret: process.env.DROPBOX_SECRET
        callbackURL: process.env.DROPBOX_CALLBACK
      }, (accessToken, refreshToken, profile, done) ->
        dropbox =
          accessToken: accessToken
          createdAt: Date.now()

        models.user.update { _id: req.user._id }, {'dropbox': dropbox}, (err) ->
          if err
            winston.error err
            done err, null

          models.user.findOne { _id: req.user._id }, (err, user) ->
            if err
              winston.error err
              done err, null
            else
              console.log user
              done null, user

        return
      )

      next()

module.exports = passportObject
