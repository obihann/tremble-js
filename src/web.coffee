express = require('express')
app = module.exports = express()
port = process.env.PORT or 3002
app.use express.static('site')

app.listen port, ->
  console.log 'TrembleJS listening at %s', port
  # TODO: OMG callback hell, we need promises!
  # TODO: yah we need to loop through the pages too
  return
