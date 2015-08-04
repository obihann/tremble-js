# load npm modules
Q = require 'q'
fs = require 'fs'
gm = require 'gm'
phantom = require 'phantom'
uuid = require 'uuid'
chai = require "chai"
assert = require('chai').assert
chaiAsPromised = require 'chai-as-promised'
request = require 'supertest-as-promised'

# load local modules
trembleWeb = require('../bin/web.js').app
tremble = require '../bin/worker'

# configure app
chai.use chaiAsPromised
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
beforeEach (done) ->
  options.res =
    width: 1680
    height: 1050
  done()

before (done) ->
  options.pagePath = options.host + ':' + options.port + '/tremble/'

  phantom.create (ph) ->
    options.ph = ph
    done()

after (done) ->
  options.page.close() if typeof options.page != 'undefined'
  options.ph.exit() if typeof options.ph != 'undefined'
  fs.unlinkSync commit + '/index.1680-1050.png'
  fs.rmdir commit
  done()

# unit tests
describe 'TrembleJS', ->
  describe 'worker.process', ->
    it 'should make a new directory and create a new phantonjs page', (done) ->
      tremble.process(options)
        .then (config) ->
          stats = fs.lstatSync commit
          assert.equal stats.isDirectory(), true, 'directory exists'
          assert.isDefined stats, 'directory stats are defined'
        .then ->
          done()
        .catch (err) ->
          done err

  describe 'worker.open', ->
    it 'should render index.html', (done) ->
      @timeout 4000

      options.ph.createPage (page) ->
        options.page = page

        tremble.open(options)
          .then (config) ->
            config.page.evaluate ->
              document.title
            , (result) ->
              assert.equal result, 'Git Mirror Sync'
          .then ->
            done()
          .catch (err) ->
            done err

  describe 'worker.setres', ->
    it 'fail when setting the resolution of the viewport to dogxcat', (done) ->
      options.pagePath += options.route

      options.page.open options.pagePath, (status) ->
        done status if status != 'success'

        options.res =
          width: 'dog'
          height: 'cat'

        tremble.setRes options
          .then (conf) ->
            done Error('resolution should not be set to an invalid type')
          .catch (err) ->
            assert.equal err.height, 300
            assert.equal err.width, 400
            done()

    it 'set the resolution of the viewport to 1680x1050', (done) ->
      options.page.open options.pagePath, (status) ->
        done status if status != 'success'

        tremble.setRes options
          .then (conf) ->
            done()
          .catch (err) ->
            done err
  
  describe 'worker.capture', ->
    it 'should render an image of the site', (done) ->
      options.page.open options.pagePath, (status) ->
        done status if status != 'success'

        tremble.capture(options)
          .then (conf) ->
            deferred = Q.defer()

            fs.readdir conf.commit, (err, files) ->
              deferred.reject err if err
              deferred.resolve files

            deferred.promise
          .then (files) ->
            if files.indexOf('index.1680-1050.png') > -1
              done()
            else
              assert.fail files, 'index.1680-1050.png'
          .catch (err) ->
            done err

    it 'rendered images should match the sample image', (done) ->
      newImg = options.commit + '/index.1680-1050.png'
      sampleImg = 'sample-capture/index.1680-1050.png'

      options =
        tolerance: 0.1

      gm.compare newImg, sampleImg, options, (err, isEqual, equality) ->
        done err if err

        console.log "image equality %s", equality

        assert.equal isEqual, true
        done()
