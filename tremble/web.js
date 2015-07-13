var amqp, app, express, port, q;

express = require('express');

app = module.exports = express();

amqp = require('amqplib');

port = process.env.PORT || 3002;

q = "tremble.queue";

app.use(express["static"]('site'));

amqp.connect(process.env.RABBITMQ_BIGWIG_URL).then(function(conn) {
  return conn.createChannel().then(function(ch) {
    return app.get('/tremble', function(req, res) {
      ch.assertQueue(q);
      ch.sendToQueue("gms.queue", new Buffer("test"));
      return res.send("looking good");
    });
  });
});

app.listen(port, function() {
  console.log('TrembleJS listening at %s', port);
});
