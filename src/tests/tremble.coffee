# load npm modules
Q       = require('q')
fs      = require('fs')
gm      = require('gm')
phantom = require('phantom')
uuid    = require('uuid')
assert  = require('assert')
expect  = require('expect')
should  = require('should')
request = require('superagent')

# load local modules
app     = require('../bin/web.js')
tremble = require('../bin/worker')

# configure app
port    = process.env.PORT || 3002
url     = 'http://localhost:' + port
commit  = uuid.v4()
options =
  host: 'http://localhost'
  route_name: 'index'
  route: 'index.html'
  delay: 2000
  port: port
  commit: commit
  res:
    width: 1680
    height: 1050

after () ->
  fs.unlinkSync commit + '/index.1680-1050.png'
  fs.rmdir commit
  options.ph.exit()

describe 'TrembleJS', () ->
  describe 'worker.process', () ->
    it 'should make a new directory and create a new phantonjs page', (done) ->
      phantom.create (ph) ->
        options.ph = ph

        tremble.process(options).then () ->
          stats = fs.lstatSync options.commit
          assert.equal stats.isDirectory(), true
          done()

  describe 'worker.open', () ->
    it 'should render index.html', (done) ->
      this.timeout 4000

      options.ph.createPage (page) ->
        options.page = page

        tremble.open(options).then (config) ->
          config.page.evaluate () ->
            return document.title
          , (result) ->
            assert.equal result, 'Git Mirror Sync'
            config.ph.exit()
            done()
        .fail (err) ->
          throw err

  describe 'worker.setres', () ->
    it 'fail when setting the resolution of the viewport to dogxcat', (done) ->
      pagePath = options.host + ':' + options.port + '/' + options.route
      options.page.open pagePath, (status) ->
        throw status if (status != 'success')

        options.res =
          width: 'dog'
          height: 'cat'

        tremble.setRes(options).then (options) ->
          throw new Error 'resolution should not be set to an invalid type'
        .fail (err) ->
          assert.equal err.height, 300
          assert.equal err.width, 400
          done()

    it 'set the resolution of the viewport to 1680x1050', (done) ->
      pagePath = options.host + ':' + options.port + '/' + options.route
      options.page.open pagePath, (status) ->
        throw status if(status != 'success')

        options.res =
          width: 1680
          height: 1050

        tremble.setRes(options).then (config) ->
          done()
        .fail (err) ->
          throw err

  describe 'worker.capture', () ->
    it 'should render an image of the site that matches the sample image',
    (done) ->
      pagePath = options.host + ':' + options.port + '/' + options.route
      options.page.open pagePath, (status) ->
        throw status if(status != 'success')

        size =
          width: options.res.width
          height: options.res.height

        options.page.set 'viewportSize', size, (status) ->
          tremble.capture(options).then (config) ->
            fs.readdir config.commit, (err, files) ->
              throw err if (err)

              if files.indexOf('index.1680-1050.png') > -1
                newImg = config.commit + '/index.1680-1050.png'
                sampleImg = 'tests/sample/index.1680-1050.png'
                gm.compare newImg, sampleImg, (err, isEqual) ->
                  throw err if (err)

                  assert.equal isEqual, true
                  done()
              else
                assert.fail files, 'index.1680-1050.png'
