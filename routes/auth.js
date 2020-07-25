const bcrypt = require('bcrypt')
const express = require('express')
const lodash = require('lodash')
const passport = require('passport')
const querystring = require('querystring')
const _ = require('underscore')
const router = express.Router()

const { Batch, Teacher, User } = require('../models/')

const findTeachers = async (slot) => {
  const shift = slot <= 15 ? 'morning' : 'evening'

  // reject all teachers not in this shift
  let teachers = await Teacher.find({ shift }).exec()

  // reject teachers not available in given slot
  teachers = _.reject(teachers, (teacher) => {
    return _.find(teacher.batches, (eachBatch) => eachBatch.slot === slot || Math.abs(eachBatch.slot - slot === 1))
  })

  return teachers
}

const findNextBatch = async (req, res, next) => {
  const nextMonday = new Date()
  let existingBatch = await Batch.find().exec()

  existingBatch = _.find(existingBatch, batch => {
    return (batch.startDate === nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7)) && batch.slot === req.body.slot)
  })

  if (existingBatch) {
    req.body.batch = existingBatch
  } else {
    const availableTeachers = await findTeachers(req.body.slot)

    console.log(availableTeachers)

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
    title: req.app.config.name
  })
})

router.post('/new/user/info', findNextBatch, async (req, res, next) => {
  if ((new Date().getFullYear) - req.body.birthDate.split('-') <= 18 || (new Date().getFullYear) - req.body.birthDate.split('-') >= 27) {
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
