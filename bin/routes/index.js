var Q, _, models;

_ = require('lodash');

Q = require('q');

models = require("../utils/schema").models;

module.exports = function(trembleWeb, passport) {
  var app;
  app = trembleWeb.app;
  app.get('/', function(req, res) {
    if (typeof req.user === 'undefined') {
      return res.render('index');
    } else {
      return res.redirect('/profile');
    }
  });
  app.get('/profile', function(req, res) {
    var cleanResults;
    if (typeof req.user === 'undefined') {
      return res.redirect('/');
    } else {
      if (typeof req.user.dropbox === 'undefined') {
        return res.render('dropbox');
      } else {
        cleanResults = [];
        return Q.all(_.map(req.user.results, function(result) {
          var leftSlash, matchLevel, rightSlash;
          result.cLeftCommit = result.leftCommit.substring(0, 7);
          result.cRightCommit = result.rightCommit.substring(0, 7);
          leftSlash = (result.left.indexOf('/')) + 1;
          rightSlash = (result.right.indexOf('/')) + 1;
          result.cLeft = result.left.substring(leftSlash, result.left.length);
          result.cRight = result.right.substring(rightSlash, result.right.length);
          matchLevel = 0;
          result.leftData = _.find(req.user.images, function(img) {
            if (img.filename === result.left) {
              matchLevel++;
            }
            if (img.filename === result.left) {
              return img;
            }
          });
          result.rightData = _.find(req.user.images, function(img) {
            if (img.filename === result.right) {
              matchLevel++;
            }
            if (img.filename === result.right) {
              return img;
            }
          });
          if (matchLevel === 2) {
            return cleanResults.push(result);
          }
        })).done(function() {
          return models.log.find({
            user: req.user._id
          }, function(err, logs) {
            var opts;
            _.each(logs, function(log) {
              var logLen, logSlash;
              logSlash = (log.commit.indexOf('/')) + 1;
              logLen = log.commit.length;
              log.cCommit = log.commit.substring(logSlash, logLen);
              return _.each(log.results, function(result) {
                var lLen, lSlash, rLen, rSlash;
                result.cLeftCommit = result.leftCommit.substring(0, 7);
                result.cRightCommit = result.rightCommit.substring(0, 7);
                lSlash = (result.left.indexOf('/')) + 1;
                rSlash = (result.right.indexOf('/')) + 1;
                lLen = result.left.length;
                rLen = result.right.length;
                result.cLeft = result.left.substring(lSlash, lLen);
                return result.cRight = result.right.substring(rSlash, rLen);
              });
            });
            opts = {
              logs: logs.reverse(),
              results: cleanResults
            };
            return res.render('profile', opts);
          });
        });
      }
    }
  });
  require('./auth')(trembleWeb, passport);
  return require('./hooks')(trembleWeb);
};
