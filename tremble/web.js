var Q, _, app, config, express, phantom, port, tremble, uuid;

_ = require('lodash');

Q = require('q');

phantom = require('phantom');

uuid = require('uuid');

express = require('express');

app = module.exports = express();

tremble = require('./worker');

config = require('./tremble');

port = process.env.PORT || 3002;

app.use(express["static"]('site'));

app.post('/hook', function(req, res) {
  return phantom.create(function(ph) {
    var commit;
    console.log('Starting phantom');
    commit = uuid.v4();
    return Q.all(_.map(config.resolutions, function(res) {
      var conf;
      conf = {
        host: "http://localhost",
        route: "index.html",
        delay: config.delay,
        port: port,
        ph: ph,
        commit: commit,
        res: res
      };
      return tremble.process(conf).then(tremble.open).then(tremble.setRes).then(tremble.capture);
    })).done(function() {
      console.log('Shutting down phantom');
      ph.exit();
      return res.send("done");
    });
  });
});

app.listen(port, function() {
  console.log('TrembleJS listening at %s', port);
});
