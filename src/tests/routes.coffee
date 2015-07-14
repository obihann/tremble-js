# load npm modules
Q       =  require 'q'
uuid    = require 'uuid'
assert  = require 'assert'
should  = require 'should'
request = require 'superagent'

# load local modules
app     = require '../bin/web.js'
tremble = require '../bin/worker'

# configure app
port    = process.env.PORT || 3002
url     = "http://localhost:" + port

# define routes
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
        assert.equal res.status, 200
        done()
