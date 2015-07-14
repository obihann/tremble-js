var DropboxOAuth2Strategy, GitHubStrategy, models, mongoose, passport, winston;

winston = require('winston');

passport = require('passport');

mongoose = require('mongoose');

models = require("./schema").models;

GitHubStrategy = require('passport-github2').Strategy;

DropboxOAuth2Strategy = require('passport-dropbox-oauth2').Strategy;

passport.serializeUser(function(user, done) {
  return done(null, user);
});

passport.deserializeUser(function(user, done) {
  return done(null, user);
});

passport.use(new GitHubStrategy({
  clientID: process.env.GH_ID,
  clientSecret: process.env.GH_SECRET,
  callbackURL: process.env.GH_CALLBACK
}, function(accessToken, refreshToken, profile, done) {
  console.log(accessToken);
  console.log(profile);
  console.log(refreshToken);
  models.user.findOne({
    githubId: profile.id
  }, function(err, user) {
    if (err) {
      winston.log('error', err);
      return done(err);
    }
    if (!user) {
      user = new models.user({
        githubId: profile.id,
        displayName: profile.displayName,
        username: profile.username,
        accessToken: accessToken,
        createdAt: Date.now()
      });
      user.save(function(err) {
        if (err) {
          return done(err);
        } else {
          return done(null, user);
        }
      });
    } else {
      return done(null, user);
    }
  });
}));

passport.use(new DropboxOAuth2Strategy({
  clientID: process.env.DROPBOX_KEY,
  clientSecret: process.env.DROPBOX_SECRET,
  callbackURL: process.env.DROPBOX_CALLBACK
}, function(accessToken, refreshToken, profile, done) {
  User.findOrCreate({
    providerId: profile.id
  }, function(err, user) {
    return done(err, user);
  });
}));

module.exports = passport;
