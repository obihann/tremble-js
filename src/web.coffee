_ = require('lodash')
Q = require('q')
phantom = require('phantom')
uuid = require('uuid')
express = require('express')
app = module.exports = express()
tremble = require('./worker')
config = require('./tremble')

port = process.env.PORT or 3002
app.use express.static('site')

app.post '/hook', (req, res) ->
  phantom.create (ph) ->
    console.log 'Starting phantom'

    commit =  uuid.v4()

    Q.all(_.map(config.resolutions, (res) ->
      conf =
        host: "http://localhost"
        route: "index.html"
        delay: config.delay
        port: port
        ph: ph
        commit: commit
        res: res

      tremble.process conf
      .then tremble.open
      .then tremble.setRes
      .then tremble.capture
    )).done ->
      console.log 'Shutting down phantom'
      ph.exit()
      res.send "done"

app.listen port, ->
  console.log 'TrembleJS listening at %s', port
  # TODO: OMG callback hell, we need promises!
  # TODO: yah we need to loop through the pages too
  return
