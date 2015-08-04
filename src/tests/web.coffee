# load npm modules
Q = require 'q'
phantom = require 'phantom'
chai = require "chai"
request = require 'supertest-as-promised'

# load local modules
trembleWeb = require('../bin/web.js').app
tremble = require '../bin/worker'

# route tests
describe 'Routes', ->
  describe 'GET /', ->
    it 'check default route', (done) ->
      request trembleWeb
        .get '/'
        .expect 200
        .then (res) ->
          done()
  
  describe 'POST /hook', () ->
    it 'checks post route', (done) ->
      request trembleWeb
        .post '/hook'
        .expect 201
        .then (res) ->
          done()
