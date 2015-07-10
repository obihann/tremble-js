var mkdirp = require('mkdirp');
var uuid = require('uuid');
var phantom = require('phantom');
var _ = require('lodash');
var config = require('./tremble');

var commit = uuid.v4();
var port = process.env.PORT || 3002;


// TODO: OMG callback hell, we need promises!
mkdirp(commit, function(err) {
    phantom.create(function (ph) {
        ph.createPage(function (page) {
            var numberRes = config.resolutions.length;

            _.each(config.resolutions, function(res, pos) {
                page.set('viewportSize', { width: res.width, height: res.height }, function(err) {
                    // TODO: yah we need to loop through the pages too
                    page.open('http://localhost:' + port, function() {
                        page.render(commit + '/index.' + res.width + '-' + res.height + '.png');

                        if ((numberRes-1) == pos) {
                            ph.exit();
                        }
                    });
                });
            });
        });
    });
});
