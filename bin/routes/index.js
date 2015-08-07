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
  require('./auth')(app, passport);
  return require('./hooks')(app);
};
