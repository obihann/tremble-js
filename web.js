var express = require('express');
var app = module.exports = express();

var port = process.env.PORT || 3002;

app.use(express.static('site'));

app.listen(port, function () {
  console.log('Example app listening at %s', port);
});
