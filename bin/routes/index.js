var Q, _;

_ = require('lodash');

Q = require('q');

module.exports = function(trembleWeb, passport) {
  var app;
  app = trembleWeb.app;
  app.get('/', function(req, res) {
    if (typeof req.user === 'undefined') {
      return res.render('index');
    } else {
      return res.redirect('/profile');
    }
  });
  app.get('/profile', function(req, res) {
    var images, keys;
    if (typeof req.user === 'undefined') {
      return res.redirect('/');
    } else {
      if (typeof req.user.dropbox === 'undefined') {
        return res.render('dropbox');
      } else {
        keys = [];
        images = [[], []];
        return Q.all(_.map(req.user.images, function(img) {
          if (keys.indexOf(img.commit) <= -1) {
            return keys.push(img.commit);
          }
        })).then(function() {
          return Q.all(_.map(req.user.images, function(img) {
            if (img.commit === keys[0]) {
              return images[0].push(img);
            } else {
              return images[1].push(img);
            }
          }));
        }).done(function() {
          var opts;
          opts = {
            commitA: keys[0],
            commitB: keys[1],
            imagesA: images[0],
            imagesB: images[1]
          };
          return res.render('profile', opts);
        });
      }
    }
  });
  require('./auth')(trembleWeb, passport);
  return require('./hooks')(trembleWeb);
};
