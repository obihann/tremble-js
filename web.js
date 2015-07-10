var Q = require('q');
var mkdirp = require('mkdirp');
var uuid = require('uuid');
var phantom = require('phantom');
var _ = require('lodash');
var commit = uuid.v4();
var express = require('express');
var app = module.exports = express();

var config = require('./tremble');
//var port = process.env.PORT || 3002;
var port = 3002;

app.use(express.static('site'));

function capture(page, res) {
    var deferred = Q.defer();

    console.log("setting viewport to %s%s", res.width, res.height);
    page.set('viewportSize', { width: res.width, height: res.height }, function(err) {

        console.log("opening %s", "index");
        page.open('http://localhost:' + port, function() {
            var filename = commit + '/index.' + res.width + '-' + res.height + '.png';

            console.log("rendering %s", filename);
            page.render(filename, function() {
                deferred.resolve();
            });
        });
    });

    return deferred.promise;
}

function process() {
    mkdirp(commit, function(err) {
        console.log("mkdir %s", commit);

        phantom.create(function (ph) {
            ph.createPage(function (page) {
                // instead of _.each or _.mmap what about a queue?
                Q.allSettled(_.map(config.resolutions, function(res) {
                    return capture(page, res);
                })).then(function() {
                    console.log("Shutting down phantom");
                    ph.exit();
                });
            });
        });
    });
}

app.listen(port, function () {
    console.log('TrembleJS listening at %s', port);
    process();
    // TODO: OMG callback hell, we need promises!
    // TODO: yah we need to loop through the pages too
});
