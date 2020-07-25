const bcrypt = require('bcrypt')
const express = require('express')
const passport = require('passport')
const router = express.Router()

const { Teacher } = require('../models/')

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
  console.log(username)
  const teacher = await Teacher.findOne({ username }).exec()
  if (!teacher) {
    return res.status(500).render('error', {
      title: req.app.config.name,
      error: new Error('No such user found!')
    })
  } else {
    const verified = console.log(bcrypt.compareSync(password, teacher.password))
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
