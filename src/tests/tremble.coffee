# load npm modules
Q = require('q')
fs = require('fs')
gm = require('gm')
phantom = require('phantom')
uuid = require('uuid')
assert = require('assert')
expect = require('expect')
should = require('should')
request = require('superagent')

# load local modules
app = require('../bin/web.js')
tremble = require('../bin/worker')

# configure app
port = process.env.PORT or 3002
url = 'http://localhost:' + port
commit = uuid.v4()
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

# mocha hooks
after ->
  fs.unlinkSync commit + '/index.1680-1050.png'
  fs.rmdir commit
  return

# route tests
describe 'Routes', () ->
  describe 'GET /', () ->
    it 'check default route', (done) ->
      request
      .get(url + '/')
      .end (err, res) ->
        assert.equal res.status, 200
        done()
  
  describe 'POST /hook', () ->
    this.timeout 10000

    it 'check default route', (done) ->
      request
      .post url + '/hook'
      .end (err, res) ->
        assert.equal res.status, 201
        done()

# unit tests
describe 'TrembleJS', ->
  describe 'worker.process', ->
    it 'should make a new directory and create a new phantonjs page', (done) ->
      phantom.create (ph) ->
        conf = options
        conf.ph = ph
        tremble.process(conf).then ->
          stats = fs.lstatSync(commit)
          assert.equal stats.isDirectory(), true
          conf.ph.exit()
          done()
          return
        return
      return
    return

  describe 'worker.open', ->
    it 'should render index.html', (done) ->
      @timeout 4000
      phantom.create (ph) ->
        conf = options
        conf.ph = ph
        conf.ph.createPage (page) ->
          conf.page = page
          tremble.open(conf).then((config) ->
            config.page.evaluate (->
              document.title
            ), (result) ->
              assert.equal result, 'Git Mirror Sync'
              config.ph.exit()
              done()
              return
            return
          ).fail (err) ->
            throw err
            return
          return
        return
      return
    return

  describe 'worker.setres', ->
    it 'fail when setting the resolution of the viewport to dogxcat', (done) ->
      phantom.create (ph) ->
        conf = options
        conf.ph = ph
        conf.ph.createPage (page) ->
          conf.page = page
          pagePath = conf.host + ':' + conf.port + '/' + conf.route

          conf.page.open pagePath, (status) ->
            if status != 'success'
              throw status

            conf.res =
              width: 'dog'
              height: 'cat'

            tremble.setRes(conf).then((conf) ->
              throw new Error('resolution should not be set to an invalid type')
            ).fail (err) ->
              assert.equal err.height, 300
              assert.equal err.width, 400
              done()

            return
          return
        return
      return

    it 'set the resolution of the viewport to 1680x1050', (done) ->
      phantom.create (ph) ->
        conf = options
        conf.ph = ph
        conf.ph.createPage (page) ->
          conf.page = page
          pagePath = conf.host + ':' + conf.port + '/' + conf.route
          conf.page.open pagePath, (status) ->
            if status != 'success'
              throw status

            conf.res =
              width: 1680
              height: 1050

            tremble.setRes(conf).then((conf) ->
              done()
            ).fail (err) ->
              throw err

            return
          return
        return
      return
    return
  
  describe 'worker.capture', ->
    it 'should render an image of the site', (done) ->
      phantom.create (ph) ->
        conf = options
        conf.ph = ph

        conf.ph.createPage (page) ->
          conf.page = page
          pagePath = conf.host + ':' + conf.port + '/' + conf.route
          conf.page.open pagePath, (status) ->
            if status != 'success'
              throw status

            size =
              width: conf.res.width
              height: conf.res.height

            conf.page.set 'viewportSize', size, (status) ->
              tremble.capture(conf).then (conf) ->
                fs.readdir conf.commit, (err, files) ->
                  if files.indexOf('index.1680-1050.png') > -1
                    throw err if err

                    done()
                  else
                    assert.fail files, 'index.1680-1050.png'

    it 'rendered images should match the sample image', (done) ->
      newImg = options.commit + '/index.1680-1050.png'
      sampleImg = 'sample-capture/index.1680-1050.png'

      gm.compare newImg, sampleImg, (err, isEqual) ->
        if err
          throw err

        assert.equal isEqual, true
        done()
