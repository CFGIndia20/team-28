/* eslint-disable eqeqeq */
const bcrypt = require('bcrypt')
const express = require('express')
const lodash = require('lodash')
const passport = require('passport')
const querystring = require('querystring')
const _ = require('underscore')
const router = express.Router()

const { Admin, Batch, Teacher, User } = require('../models/')
const questions = require('../config/quiz')

const findTeachers = async (slot) => {
  slot = parseInt(slot)
  const shift = slot <= 15 ? 'morning' : 'evening'

  // reject all teachers not in this shift
  let teachers = await Teacher.find({ shift }).populate('batches').exec()

  // reject teachers not available in given slot
  teachers = _.reject(teachers, (teacher) => {
    return _.find(teacher.batches, (eachBatch) => eachBatch.slot == slot || Math.abs(eachBatch.slot - slot) === 1)
  })

  return teachers
}

const findNextBatch = async (req, res, next) => {
  const today = new Date()
  const nextMonday = today.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7))
  let existingBatch = await Batch.find().exec()

  existingBatch = _.find(existingBatch, (batch) => {
    const d1 = new Date(parseInt(nextMonday)).getDate()
    const d2 = new Date(parseInt(batch.startDate)).getDate()

    // eslint-disable-next-line eqeqeq
    return (d1 === d2 && batch.slot == req.body.slot)
  })

  console.log('EXISTING', existingBatch)
  if (existingBatch) {
    req.body.batch = existingBatch
    return next()
  } else {
    const availableTeachers = await findTeachers(req.body.slot)

    if (!availableTeachers.length) {
      return next()
    }

    const teacher = _.sample(availableTeachers)

    const newBatch = new Batch({
      createdOn: new Date(),
      startDate: nextMonday,
      endDate: nextMonday + 4 * 30 * 24 * 3600 * 1000,
      slot: req.body.slot,
      teacher: teacher._id
    })

    await newBatch.save()
    teacher.batches.push(newBatch._id)
    await teacher.save()
    req.body.batch = newBatch
    next()
  }
}

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
    title: req.app.config.name,
    questions
  })
})

router.post('/new/user/info', findNextBatch, async (req, res, next) => {
  if (new Date().getFullYear - req.body.birthDate.split('-') <= 18 || new Date().getFullYear - req.body.birthDate.split('-') >= 27) {
    return res.status(404).render('error', {
      error: new Error('You must be between 17-27 years old to register !')
    })
  }
  if (!req.body.batch) {
    return res.render('auth/forms/user', {
      title: req.app.config.name,
      error: new Error('Please choose another slot !')
    })
  }

  lodash.set(req.session.passport.user, ['general.birthDate'], req.body.birthDate)
  lodash.set(req.session.passport.user, ['general.phone'], req.body.phone)
  lodash.set(req.session.passport.user, ['general.location'], {
    location: req.body.address,
    postalCode: req.body.postalCode,
    city: req.body.city,
    region: req.body.region
  })
  lodash.set(req.session.passport.user, ['education'], {
    institution: req.body.institution,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    percentage: req.body.percentage
  })
  lodash.set(req.session.passport.user, ['batch'], req.body.batch._id)
  const newUser = new User(req.session.passport.user)
  try {
    await newUser.save()
    const newBatch = await Batch.findById(req.body.batch._id).exec()
    newBatch.students.push(newUser._id)
    await newBatch.save()
  } catch (error) {
    return res.render('error', {
      error
    })
  }
  req.session.user = newUser
  res.redirect('/?logged-in=' + Math.random().toString().slice(2).slice(0, 5))
})

router.get('/out', (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/?action=logout')
  })
})

router.get('/admin', async (req, res) => {
  const admin = await Admin.findOne({ username: process.env.ADMIN }).exec()
  if (!admin) {
    const newAdmin = new Admin({
      username: process.env.ADMIN,
      password: process.env.ADMIN_PASS,
      general: {
        name: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL,
        picture: '/images/admin.png'
      }
    })
    newAdmin.password = newAdmin.generateHash(newAdmin.password)
    await newAdmin.save()
  }
  res.render('auth/admin_login', {
    title: req.app.config.name,
    error: false
  })
})

router.post('/admin', passport.authenticate('local', { failureRedirect: '/err' }), (req, res) => {
  console.log(req.session.passport.user)
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
