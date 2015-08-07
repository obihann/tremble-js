mongoose = require('mongoose')
Schema = mongoose.Schema

UserSchema = new Schema
  githubId: String
  displayName: String
  username: String
  accessToken: String
  createdAt: Number
  dropbox:
    id: String
    accessToken: String
    createdAt: Number
  images: [
    filename: String
    dropbox: String
    commit: String
    data: String
  ]

Users = mongoose.model('Users', UserSchema)

module.exports =
  schema:
    user: UserSchema
  models:
    user: Users
