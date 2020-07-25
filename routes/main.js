const express = require('express')
const router = express.Router()

const { Admin, Teacher, User } = require('../models')

/* GET home page. */
router.get('/', async (req, res, next) => {
  let user
  if (req.session.user) {
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

    res.render('index', {
      user,
      title: req.app.config.title,
      events: req.app.events
    })
  } else {
    res.render('land', {
      title: req.app.config.name,
      error: req.query.error || false
    })
  }
})

module.exports = router
