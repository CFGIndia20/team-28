require('dotenv').config()
const bodyParser = require('body-parser')
const compression = require('compression')
const connectMongo = require('connect-mongo')
const cookieParser = require('cookie-parser')
const express = require('express')
const minify = require('express-minify')
const session = require('express-session')
const createError = require('http-errors')
const logger = require('morgan')
const path = require('path')
const MongoStore = connectMongo(session)

const appConfig = require('./config')

// Route Imports
const { IndexRouter } = require('./routes')

const app = express()
app.config = appConfig

// View Engine Setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

const cooky = {
  secret: 'work hard',
  resave: true,
  expires: new Date() * 60 * 60 * 24 * 7,
  saveUninitialized: true,
  store: new MongoStore({ url: app.config.db.connectionUri })
}

app.sessionMiddleware = session(cooky)

if (process.env.NODE_ENV === 'production') {
  console.log('Production mode on')
  app.use(compression())
  app.use(
    minify({
      cache: path.join(__dirname, 'public', 'cache'),
      uglifyJS: true
    })
  )
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=86400')
    next()
  })
}

app.set('trust proxy', 1)
app.use(app.sessionMiddleware)
app.use(logger('tiny'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
const date = new Date()

app.events = [
  {
    title: 'The Nudge Foundation',
    text: 'A Nudge to the Future You !',
    img: '/images/nudge.jpeg',
    time: [date, date.setDate(date.getDate() + 1)],
    link: {
      link_url: 'https://github.com/CFGIndia20/team-28',
      link_text: 'Visit'
    }
  }
]

app.use(express.static(path.join(__dirname, 'public'), process.env.NODE_ENV === 'production' ? { maxAge: 31557600 } : {}))

app.use((req, res, next) => {
  res.locals.user = req.session.user ? req.session.user : false
  res.locals.where = req.url
  next()
})

app.use('/', IndexRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})

// 404 error handler
app.use((error, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = error.message
  res.locals.error = req.app.get('env') === 'development' ? error : {}

  // render 404 page
  res.status(error.status || 500)
  res.render('error')
})

module.exports = app
