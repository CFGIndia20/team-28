require('dotenv').config()
const bodyParser = require('body-parser')
const chalk = require('chalk')
const compression = require('compression')
const connectMongo = require('connect-mongo')
const cookieParser = require('cookie-parser')
const express = require('express')
const minify = require('express-minify')
const session = require('express-session')
const createError = require('http-errors')
const logger = require('morgan')
const passport = require('passport')
const path = require('path')
const MongoStore = connectMongo(session)

const { Admin, Notification, Teacher, User } = require('./models')

require('./utils/passport/local')

const appConfig = require('./config')

// Route Imports
const { AuthRouter, IndexRouter } = require('./routes')

const app = express()
app.config = appConfig
app.colorLog = (sentence, color) => {
  console.log(chalk[color](sentence))
}

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
    img: '/images/background.jpeg',
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

app.use(passport.initialize())
app.use(passport.session())

app.use(async (req, res, next) => {
  if (!req.query.delete_notif || !req.session.user) {
    return next()
  }
  next = () => {
    console.log(req.originalUrl)
    return res.redirect(
      req.originalUrl.split('delete_notif=' + req.query.delete_notif).join('')
    )
  }
  let user
  switch (req.session.user.usertype) {
    case 'Admin':
      user = await Admin.findById(req.session.user._id).populate('notifications').exec()
      break
    case 'Teacher':
      user = await Teacher.findById(req.session.user._id).populate('notifications').exec()
      break
    case 'User':
      user = await User.findById(req.session.user._id).populate('notifications').exec()
  }

  if (!user) {
    return next()
  }

  const notif = user.notifications.find(x => x.id === req.query.delete_notif)
  if (!notif) {
    return next()
  }
  await Notification.deleteOne({ _id: notif._id }).exec()
  user.notifications.splice(user.notifications.indexOf(notif), 1)
  await user.save()
  return next()
})

app.use('/', IndexRouter)
app.use('/account/', AuthRouter)
app.use(async (req, res, next) => {
  if (req.session.user) {
    let user
    try {
      switch (req.session.user.usertype) {
        case 'Admin':
          user = await Admin.findById(req.session.user._id).exec()
          break
        case 'Teacher':
          user = await Teacher.findById(req.session.user._id).exec()
          break
        case 'User':
          user = await User.findById(req.session.user._id).exec()
      }
    } catch (error) {
      next(new Error('Could not restore User from Session.'))
    }

    if (user) {
      req.session.user = user
      return next()
    } else {
      return next(new Error('Could not restore User from Session.'))
    }
  } else res.redirect('/')
})

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
