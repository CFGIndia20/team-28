const express = require('express')
const router = express.Router()

const { Teacher } = require('../models')

router.get('/create/teacher', (req, res) => {
  res.render('admin/teacher', {
    title: req.app.config.name
  })
})

router.post('/create/teacher', async (req, res) => {
  const {
    name,
    email,
    dob,
    phone,
    gender,
    shift,
    postalCode,
    address,
    city,
    region
  } = req.body
  const username = email.substr(0, email.lastIndexOf('@'))
  let teacher = await Teacher.findOne({ username }).exec()
  if (teacher) {
    return res.status(400).render('error', {
      error: new Error('Teacher already registered')
    })
  } else {
    teacher = new Teacher({
      username,
      password: 'pass@123',
      general: {
        name,
        email,
        birthDate: dob,
        gender,
        picture: '/images/teacher.png',
        phone,
        location: {
          address: address,
          postalCode: postalCode,
          city: city,
          region: region
        }
      },
      shift
    })
    teacher.password = teacher.generateHash(teacher.password)
    await teacher.save()
  }
  res.redirect('/')
})

module.exports = router
