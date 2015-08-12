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

Users = mongoose.model('Users', UserSchema)

module.exports =
  schema:
    user: UserSchema
  models:
    user: Users
