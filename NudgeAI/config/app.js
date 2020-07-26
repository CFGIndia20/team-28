require('dotenv').config()
const dbHost = process.env.DBHOST || 'mongodb://localhost:27017/nudgeai'

module.exports = {
  name: 'nudge.ai',
  title: 'Nudge.ai',
  http: {
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || 3000
  },
  author: 'und3fined-v01d',
  version: '1.0.0',
  db: {
    connectionUri: dbHost,
    params: {},
    collections: ['moment', 'user', 'feeling', 'ask']
  }
}
