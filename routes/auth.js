const bcrypt = require('bcrypt')
const express = require('express')
const passport = require('passport')
const querystring = require('querystring')
const router = express.Router()

const { Teacher } = require('../models/')

router.get(
  '/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'] })
)

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/err' }), (req, res) => {
  if (req.session.passport.user.exists) {
    delete req.session.passport.user.exists
    req.session.user = req.session.passport.user
    res.redirect('/?logged-in=' + Math.random().toString().slice(2).slice(0, 5))
  } else {
    const query = querystring.stringify({
      username: req.session.passport.user.username
    })

    res.redirect('/account/new/user/info?' + query)
  }
})

router.get('/new/user/info', (req, res, next) => {
  res.render('auth/forms/user', {
    title: req.app.config.name
  })
})

router.get('/out', (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/?action=logout')
  })
})

router.post('/admin/', passport.authenticate('local', { failureRedirect: '/err' }), (req, res) => {
  req.session.user = req.session.passport.user
  res.redirect('/?logged-in=' + Math.random().toString().slice(2).slice(0, 5))
})

router.get('/teacher/login/', (req, res, next) => {
  res.render('auth/teacher_login', {
    title: req.app.config.name,
    error: false
  })
})

router.post('/teacher/login/', async (req, res, next) => {
  const { username, password } = req.body
  const teacher = await Teacher.findOne({ username }).exec()
  if (!teacher) {
    return res.status(500).render('error', {
      title: req.app.config.name,
      error: new Error('No such user found!')
    })
  } else {
    const verified = bcrypt.compareSync(password, teacher.password)
    if (verified) {
      req.session.user = teacher
      res.redirect('/?logged-in=' + Math.random().toString().slice(2).slice(0, 5))
    } else {
      res.status(500).render('error', {
        title: req.app.config.name,
        error: new Error('Wrong username/password!')
      })
    }
  }
})

module.exports = router
