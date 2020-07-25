module.exports = {
  name: 'nudge',
  title: 'Nudge',
  http: {
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || 3000
  },
  author: 'und3fined-v01d',
  version: '1.0.0',
  db: {
    connectionUri: process.env.DBHOST || 'mongodb://localhost:27017/nudge',
    params: {},
    collections: ['moment', 'user', 'feeling', 'ask']
  }
}
