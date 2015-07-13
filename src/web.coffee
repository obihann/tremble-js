express = require('express')
app = module.exports = express()
amqp = require('amqplib')

port = process.env.PORT or 3002
q = "tremble.queue"
app.use express.static('site')

amqp.connect(process.env.RABBITMQ_BIGWIG_URL).then((conn) ->
  conn.createChannel().then (ch) ->
    app.get '/tremble', (req, res) ->
      ch.assertQueue q
      ch.sendToQueue "gms.queue", new Buffer("test")
      res.send "looking good"
)

app.listen port, ->
  console.log 'TrembleJS listening at %s', port
  # TODO: yah we need to loop through the pages too
  return
