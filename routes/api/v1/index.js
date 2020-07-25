const express = require('express')
const Fuse = require('fuse')
const q = require('queue')({ autostart: true })
const _ = require('underscore')
const router = express.router()
const { Admin, User, Teacher } = require('../../../models')

// Rate limiting
router.use(async (req, res, next) => {
  q.push(async () => {
    next()
  })
})

router.use(async (req, res, next) => {
  const date = new Date()
  const sessionDate = new Date(req.session.lastApi)
  if (sessionDate) {
    if (date - sessionDate < 2000) {
      setTimeout(() => {
        next()
        req.session.lastApi = date
      }, 1000)
    } else {
      next()
      req.session.lastApi = date
    }
  } else {
    req.session.lastApi = date
    next()
  }
})

router.get('/v1/search', async (req, res) => {
  const userOptions = {
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ['username', 'general.name', 'general.email']
  }

  const teacherOptions = {
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ['username', 'name', 'email']
  }

  let users, teachers
  try {
    users = await User.find({}).exec()
    teachers = await Teacher.find({}).exec()
  } catch (error) {
    res.status(500).send({ message: 'Database error!' })
  }
  const userFuse = new Fuse(users, userOptions)
  const teacherFuse = new Fuse(teachers, teacherOptions)

  if (!req.query || !req.query.q) {
    return res.send({
      users,
      teachers
    })
  }

  return res.send({
    users: _.pluck(userFuse.search(req.query.q), 'item'),
    teachers: _.pluck(teacherFuse.search(req.query.q), 'item')
  })
})

router.get('/v1/notifications', async (req, res) => {
  let user
  try {
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
  } catch (error) {
    console.log(error)
  }
  if (user) {
    res.send(user.notifications.length.toString())
  }
})

router.post('/v1/notifications/markAsRead', async (req, res, next) => {
  let user
  try {
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
  } catch (error) {
    console.log(error)
  }
  user.notifications = []
  await user.save()
  res.redirect('/notifications')
})
