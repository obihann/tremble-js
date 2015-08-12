var MongoStore, Q, _, amqp, app, bodyParser, express, mongoose, passport, port, session, trembleWeb, winston;

winston = require('winston');

_ = require('lodash');

Q = require('q');

amqp = require('amqplib');

bodyParser = require('body-parser');

express = require('express');

session = require('express-session');

mongoose = require('mongoose');

MongoStore = require('connect-mongo')(session);

passport = require('./utils/passport');

winston.level = process.env.WINSTON_LEVEL;

port = process.env.PORT || 3002;

app = express();

app.set('view engine', 'jade');

app.use(express["static"]('public'));

app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_DB);

app.use(session({
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  }, function(err) {
    console.log(err || 'connect-mongodb setup ok');
  }),
  ttl: 24 * 3600,
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: false
}));

app.use(passport.passport.initialize());

app.use(passport.passport.session());

trembleWeb = {
  app: app,
  q: process.env.RABBITMQ_QUEUE,
  rabbitMQ: process.env.RABBITMQ_BIGWIG_URL,
  startup: function() {
    winston.log('info', 'connecting to rabbitMQ');
    return amqp.connect(trembleWeb.rabbitMQ).then(trembleWeb.createChannel).then(function(ch) {
      var ok;
      ok = ch.assertQueue(trembleWeb.q, {
        durable: true
      });
      return trembleWeb.ch = ch;
    })["catch"](function(err) {
      return trembleWeb.setupError(err);
    });
  },
  createChannel: function(conn) {
    winston.log("info", "creating channel");
    return conn.createChannel();
  },
  setupError: function(err) {
    winston.error(err);
    return process.exit(1);
  }
};

trembleWeb.startup().then(function() {
  trembleWeb.routes = require('./routes')(trembleWeb, passport);
  return app.listen(port, function() {
    return winston.log('info', 'TrembleJS listening at %s', port);
  });
})["catch"](function(err) {
  return trembleWeb.setupError(err);
});

module.exports = trembleWeb;
