winston = require 'winston'

winston.level = process.env.WINSTON_LEVEL

module.exports = (app) ->
  app.post '/hook',
  (req, res) ->
    winston.log 'info', 'POST /hook'
    trembleWeb.ch.assertQueue trembleWeb.q
    trembleWeb.ch.sendToQueue trembleWeb.q, new Buffer("test")
    res.sendStatus  201
