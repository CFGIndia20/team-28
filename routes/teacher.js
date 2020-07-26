const express = require('express')
const router = express.Router()
const _ = require('underscore')

const { Teacher } = require('../models')

router.get('/schedule', async (req, res) => {
  const teacher = await Teacher.findOne({ username: req.session.user.username }).populate('batches').exec()
  const currentHour = new Date().getHours()
  teacher.batches = _.reject(teacher.batches, batch => {
    return (Date.now() > batch.endDate)
  })
  await teacher.save()
  teacher.batches = _.sortBy(teacher.batches, batch => batch.slot)
  const expired = []; const left = []
  _.each(teacher.batches, batch => {
    if (batch.slot.startDate < Date.now()) {
      if (currentHour > batch.slot + 1) { expired.push(batch) } else { left.push(batch) }
    }
  })
  res.render('teacher/schedule', {
    title: req.app.config.name,
    user: teacher,
    left,
    expired
  })
})

module.exports = router
