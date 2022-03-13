const { Application } = require('./dist/Application')
module.exports = new Application(
  require('./config.json'),
  require('./package.json')
)
