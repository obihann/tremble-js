winston = require 'winston'
Q = require 'q'
spawn = require('child_process').spawn

git = 'git'
winston.level = process.env.WINSTON_LEVEL

childExit = (deferred, code, config, err) ->
  if code != 0
    if typeof(err) != 'undefined'
      deferred.reject err
    else
      err = new Error 'child process failed response expected 0 actual ' + code
      deferred.reject err
  else
    deferred.resolve config

app =
  gitClone: (config) ->
    winston.log 'info', 'git.gitClone'
    deferred = Q.defer()

    child = spawn git, [
      'clone',
      'https://' + config.ghkey + '@github.com/' + config.repo + '.git',
      'public/tremble'
    ]

    err = null

    child.stderr.on 'data', (data) ->
      err = new Error '' + data

    child.on 'close', (code) ->
      childExit deferred, code, config, err

    deferred.promise
  gitReset: (config) ->
    winston.log 'info', 'git.gitReset'
    deferred = Q.defer()

    child = spawn git, [
      'reset',
      '--hard',
      config.commit
    ],
    {cwd: 'public/tremble'}

    err = null

    child.stderr.on 'data', (data) ->
      err = new Error '' + data

    child.on 'close', (code) ->
      childExit deferred, code, config, err

    deferred.promise
  gitPull: (config) ->
    winston.log 'info', 'git.gitPull'
    deferred = Q.defer()

    child = spawn git, [
      'pull'
    ],
    {cwd: 'public/tremble'}

    err = null

    child.stderr.on 'data', (data) ->
      err = new Error '' + data

    child.on 'close', (code) ->
      childExit deferred, code, config, err

    deferred.promise

module.exports = app
