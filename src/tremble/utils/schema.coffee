mongoose = require('mongoose')
Schema = mongoose.Schema

UserSchema = new Schema
  githubId: String
  displayName: String
  username: String
  accessToken: String
  createdAt: Number
  results: [
    left: String
    leftCommit: String
    right: String
    rightCommit: String
    status: Boolean
  ]
  dropbox:
    id: String
    accessToken: String
    createdAt: Number
  images: [
    commit: String
    createdAt: Number
    filename: String
    dropbox: String
    data: String
  ]

LogSchema = new Schema
  user:
    type: Schema.Types.ObjectId
    ref: 'Users'
  time:
    type: Date
    default: Date.now
  status: String
  repo: String
  commit: String
  message: String
  request: String
  results: [
    left: String
    leftCommit: String
    right: String
    rightCommit: String
    status: Boolean
  ]

Users = mongoose.model('Users', UserSchema)
Logs = mongoose.model('Logs', LogSchema)

module.exports =
  schema:
    user: UserSchema
    log: LogSchema
  models:
    user: Users
    log: Logs
