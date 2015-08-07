var winston;

winston = require('winston');

winston.level = process.env.WINSTON_LEVEL;

module.exports = function(trembleWeb, passport) {
  trembleWeb.app.get('/logout', function(req, res) {
    winston.log('info', 'GET /logout');
    req.logout();
    return res.redirect('/');
  });
  trembleWeb.app.get('/auth/github', passport.strategies.github, passport.passport.authenticate('github', {
    scope: ['user:email']
  }));
  trembleWeb.app.get('/auth/github/callback', passport.strategies.github, passport.passport.authenticate('github', {
    scope: ['user:email']
  }), function(req, res) {
    winston.log('info', 'GET /auth/github/callback');
    return res.redirect('/profile');
  });
  trembleWeb.app.get('/auth/dropbox', passport.strategies.dropbox, passport.passport.authenticate('dropbox-oauth2'));
  return trembleWeb.app.get('/auth/dropbox/callback', passport.strategies.dropbox, passport.passport.authenticate('dropbox-oauth2'), function(req, res) {
    winston.log('info', 'GET /auth/dropbox/callback');
    return res.redirect('/profile');
  });
};
