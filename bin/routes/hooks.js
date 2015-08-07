var winston;

winston = require('winston');

winston.level = process.env.WINSTON_LEVEL;

module.exports = function(trembleWeb) {
  return trembleWeb.app.post('/hook', function(req, res) {
    winston.log('info', 'POST /hook');
    trembleWeb.ch.assertQueue(trembleWeb.q);
    trembleWeb.ch.sendToQueue(trembleWeb.q, new Buffer("test"));
    return res.sendStatus(201);
  });
};
