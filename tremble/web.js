var MongoStore, Q, Schema, _, app, bodyParser, config, express, mongoose, passport, phantom, port, session, tremble, uuid, winston;

winston = require('winston');

_ = require('lodash');

Q = require('q');

mongoose = require('mongoose');

express = require('express');

session = require('express-session');

MongoStore = require('connect-mongo')(session);

bodyParser = require('body-parser');

phantom = require('phantom');

uuid = require('uuid');

express = require('express');

app = module.exports = express();

passport = require('./passport');

Schema = mongoose.Schema;

tremble = require('./worker');

config = require('./tremble');

mongoose.connect(process.env.MONGO_DB);

port = process.env.PORT || 3002;

app.use(express["static"]('site'));

app.use(bodyParser.json());

app.use(session({
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  }, function(err) {
    console.log(err || 'connect-mongodb setup ok');
  }),
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: false
}));

app.use(passport.initialize());

app.use(passport.session());

app.get('/logout', function(req, res) {
  winston.log('info', 'GET /logout');
  req.logout();
  return res.redirect('/');
});

app.get('/auth/github', passport.authenticate('github'));

app.get('/auth/github/callback', passport.authenticate('github'), function(req, res) {
  winston.log('info', 'GET /auth/github/callback');
  return res.redirect('/');
});

app.post('/hook', function(req, res) {
  return phantom.create(function(ph) {
    var commit;
    console.log('Starting phantom');
    commit = uuid.v4();
    return Q.all(_.map(config.pages, function(page) {
      return Q.all(_.map(config.resolutions, function(res) {
        var conf;
        conf = {
          host: "http://localhost",
          route_name: page.title,
          route: page.path,
          delay: config.delay,
          port: port,
          ph: ph,
          commit: commit,
          res: res
        };
        return tremble.process(conf).then(tremble.open).then(tremble.setRes).then(tremble.capture);
      }));
    })).done(function() {
      console.log('Shutting down phantom');
      ph.exit();
      return res.send("done");
    });
  });
});

app.listen(port, function() {
  return console.log('TrembleJS listening at %s', port);
});
