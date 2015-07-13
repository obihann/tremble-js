var Q, _, app, config, express, phantom, port, tremble, uuid;

_ = require('lodash');

Q = require('q');

phantom = require('phantom');

uuid = require('uuid');

express = require('express');

app = module.exports = express();

tremble = require('./worker');

config = require('./tremble');

console.log(tremble);

port = process.env.PORT || 3002;

app.use(express["static"]('site'));

app.post('/hook', function(req, res) {
  return phantom.create(function(ph) {
    var commit;
    console.log('Starting phantom');
    commit = uuid.v4();
    return Q.all(_.map(config.resolutions, function(res) {
      config = {
        port: port,
        ph: ph,
        commit: commit,
        res: res
      };
      return tremble.process(config).then(tremble.open).then(tremble.setRes).then(tremble.capture);
    })).done(function() {
      console.log('Shutting down phantom');
      return ph.exit();
    });
  });
});

app.listen(port, function() {
  console.log('TrembleJS listening at %s', port);
});
