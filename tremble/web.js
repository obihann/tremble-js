var app, express, port;

express = require('express');

app = module.exports = express();

port = process.env.PORT || 3002;

app.use(express["static"]('site'));

app.listen(port, function() {
  console.log('TrembleJS listening at %s', port);
});
