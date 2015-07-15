winston = require('winston')
_ = require('lodash')
Q = require('q')
phantom = require('phantom')
uuid = require('uuid')
express = require('express')
app = module.exports = express()
tremble = require('./worker')
config = require('./tremble')
amqp = require('amqplib')

winston.level = process.env.WINSTON_LEVEL
port = process.env.PORT or 3002
q = "tremble.queue"
app.use express.static('site')

amqp.connect(process.env.RABBITMQ_BIGWIG_URL).then (conn) ->
  conn.createChannel().then (ch) ->
    app.get '/tremble', (req, res) ->

    app.post '/hook', (req, res) ->
      ch.assertQueue q
      ch.sendToQueue "gms.queue", new Buffer("test")
      res.sendStatus  201
      #phantom.create (ph) ->
        #winston.log 'verbose', 'Starting phantom'

        #commit =  uuid.v4()

        #Q.all(_.map(config.pages, (page) ->
          #Q.all(_.map(config.resolutions, (res) ->
            #conf =
              #host: "http://localhost"
              #route_name: page.title
              #route: page.path
              #delay: config.delay
              #port: port
              #ph: ph
              #commit: commit
              #res: res

            #tremble.process conf
            #.then tremble.open
            #.then tremble.setRes
            #.then tremble.capture
          #))
        #)).done ->
          #winston.log 'verbose', 'Shutting down phantom'
          #ph.exit()
          #res.send "done"

app.listen port, ->
  winston.log 'info', 'TrembleJS listening at %s', port
