winston = require('winston')
_ = require('lodash')
Q = require('q')
mongoose = require('mongoose')
express = require('express')
session = require('express-session')
MongoStore = require('connect-mongo')(session)
bodyParser = require('body-parser')
phantom = require('phantom')
uuid = require('uuid')
express = require('express')
app = module.exports = express()
passport = require('./passport')

Schema = mongoose.Schema

tremble = require('./worker')
config = require('./tremble')

mongoose.connect process.env.MONGO_DB

port = process.env.PORT or 3002
app.use express.static 'site'
app.use bodyParser.json()

app.use session(
  store: new MongoStore({ mongooseConnection: mongoose.connection }, (err) ->
    console.log err or 'connect-mongodb setup ok'
    return
)
  secret: 'keyboard cat'
  resave: true
  saveUninitialized: false)

app.use passport.initialize()
app.use passport.session()

app.get '/logout', (req, res) ->
  winston.log 'info', 'GET /logout'
  req.logout()
  res.redirect '/'

app.get '/auth/github', passport.authenticate('github')

app.get '/auth/github/callback', passport.authenticate('github'), (req, res) ->
  winston.log 'info', 'GET /auth/github/callback'
  res.redirect '/'

#app.get '/auth/dropbox', passport.authenticate('dropbox-oauth2')

#app.get '/auth/dropbox/callback',
  #passport.authenticate 'dropbox-oauth2',
  #{ failureRedirect: '/login' }
  #, (req, res) ->
    #res.redirect('/')

app.post '/hook', (req, res) ->
  phantom.create (ph) ->
    console.log 'Starting phantom'
    commit =  uuid.v4()

    Q.all(_.map(config.pages, (page) ->
      Q.all(_.map(config.resolutions, (res) ->
        conf =
          host: "http://localhost"
          route_name: page.title
          route: page.path
          delay: config.delay
          port: port
          ph: ph
          commit: commit
          res: res

        tremble.process conf
        .then tremble.open
        .then tremble.setRes
        .then tremble.capture
      ))
    )).done ->
      console.log 'Shutting down phantom'
      ph.exit()
      res.send "done"

app.listen port, ->
  console.log 'TrembleJS listening at %s', port
