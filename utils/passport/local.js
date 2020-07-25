const passport = require('passport')
const LocalStrategy = require('passport-local')
const { Admin } = require('../../models')

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  // save whole user as session
  done(null, user)
})

passport.use(
  new LocalStrategy(async (username, password, done) => {
    const admin = await Admin.findOne({ username: username }).exec()
    if (admin) {
      return done(null, admin)
    } else {
      return done(null, false)
    }
  })
)
