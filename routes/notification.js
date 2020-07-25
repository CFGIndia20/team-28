const router = require('express').Router()
const { Admin, Teacher, User } = require('../models')

router.get('/', async (req, res, next) => {
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
    return res.status(500).render('error', {
      error: new Error('Error fetching notifications')
    })
  }

  res.render('user/notifications', {
    title: req.app.config.title,
    user
  })
})

module.exports = router
