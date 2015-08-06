var winston;

winston = require('winston');

winston.level = process.env.WINSTON_LEVEL;

module.exports = function(trembleWeb, passport) {
  var app;
  app = trembleWeb.app;
  app.get('/', function(req, res) {
    if (typeof req.user === 'undefined') {
      return res.render('index');
    } else {
      return res.render('profile');
    }
  });
  app.get('/profile', function(req, res) {
    if (typeof req.user === 'undefined') {
      return res.redirect('/');
    } else {
      if (typeof req.user.dropbox === 'undefined') {
        return res.render('dropbox');
      } else {
        return res.render('profile');
      }
    }
  });
  app.get('/logout', function(req, res) {
    winston.log('info', 'GET /logout');
    req.logout();
    return res.redirect('/');
  });
  app.get('/auth/github', passport.strategies.github, passport.passport.authenticate('github', {
    scope: ['user:email']
  }));
  app.get('/auth/github/callback', passport.strategies.github, passport.passport.authenticate('github', {
    scope: ['user:email']
  }), function(req, res) {
    winston.log('info', 'GET /auth/github/callback');
    return res.redirect('/profile');
  });
  app.get('/auth/dropbox', passport.strategies.dropbox, passport.passport.authenticate('dropbox-oauth2'));
  app.get('/auth/dropbox/callback', passport.strategies.dropbox, passport.passport.authenticate('dropbox-oauth2'), function(req, res) {
    winston.log('info', 'GET /auth/dropbox/callback');
    return res.redirect('/profile');
  });
  return app.post('/hook', function(req, res) {
    winston.log('info', 'POST /hook');
    trembleWeb.ch.assertQueue(trembleWeb.q);
    trembleWeb.ch.sendToQueue(trembleWeb.q, new Buffer("test"));
    return res.sendStatus(201);
  });
};
