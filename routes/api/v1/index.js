const express = require('express')
const router = express.router()

const { Admin, Teacher, User } = require('../../../models')

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
