var Q, _, app, fs, gm, mkdirp, winston;

fs = require('fs');

winston = require('winston');

Q = require('q');

mkdirp = require('mkdirp');

_ = require('lodash');

gm = require('gm');

winston.level = process.env.WINSTON_LEVEL;

app = {
  saveToDisk: function(user) {
    winston.log('info', 'compare.saveToDisk');
    return Q.all(_.map(user.images, function(img) {
      var buffer, deferred;
      deferred = Q.defer();
      mkdirp('screenshots/' + img.commit, function(err) {
        if (err) {
          return deferred.reject(err);
        }
      });
      buffer = new Buffer(img.data, 'base64');
      fs.writeFile('screenshots/' + img.filename, buffer, function(err) {
        if (err) {
          deferred.reject("unable to save image");
        }
        winston.log('verbose', 'file %s saved to filesystem', img.filename);
        return deferred.resolve(user);
      });
      return deferred.promise;
    })).then(function() {
      return user;
    });
  },
  compare: function(user) {
    var images, keys;
    if (user.images.length < 2) {
      return user;
    }
    winston.log('info', 'compare.compare');
    keys = [];
    images = [[], []];
    _.all(user.images, function(img) {
      if (keys.indexOf(img.commit) <= -1) {
        return keys.push(img.commit);
      }
    });
    _.all(user.images, function(img) {
      if (img.commit === keys[0]) {
        return images[0].push(img);
      } else {
        return images[1].push(img);
      }
    });
    return Q.all(_.map(images[0], function(img, key) {
      var deferred, gmOpts, leftImg, rightImg, rightImgObj;
      deferred = Q.defer();
      leftImg = 'screenshots/' + img.filename;
      rightImgObj = _.find(images[1], function(rImg) {
        var cLeft, cRight, leftSlash, rightSlash;
        leftSlash = (img.filename.indexOf('/')) + 1;
        rightSlash = (rImg.filename.indexOf('/')) + 1;
        cLeft = img.filename.substring(leftSlash, img.filename.length);
        cRight = rImg.filename.substring(rightSlash, rImg.filename.length);
        if (cLeft === cRight) {
          return rImg;
        }
      });
      rightImg = 'screenshots/' + rightImgObj.filename;
      gmOpts = {
        tolerance: 0
      };
      if (typeof user.results === 'undefined') {
        user.results = [];
      }
      gm.compare(leftImg, rightImg, gmOpts, function(err, isEqual, equality) {
        if (err) {
          winston.error(err);
        }
        winston.log('info', 'comparison of %s, and %s', leftImg, rightImg);
        winston.log('info', 'results: %s', leftImg, rightImg, isEqual);
        user.results.push({
          left: img.filename,
          leftCommit: img.commit,
          right: rightImgObj.filename,
          rightCommit: rightImgObj.commit,
          status: isEqual
        });
        return deferred.resolve(user);
      });
      return deferred.promise;
    })).then(function() {
      return user;
    });
  }
};

module.exports = app;
