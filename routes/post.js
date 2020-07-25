const { bgBlueBright } = require('chalk')
const path = require('path')
const marked = require('marked')
const mv = require('mv')
const mime = require('mime-types')
const router = require('express').Router()
const _ = require('underscore')
const formParser = require('../utils/parsers/form-parser')
const { Admin, Teacher, Post, User } = require('../models')

const validFileTypes = ['png', 'jpeg', 'gif', 'jpg', 'mov', 'mp4']

router.get('/upload', (req, res, next) => {
  res.render('upload/post', {
    title: req.app.config.name,
    user: req.session.user
  })
})

router.post('/upload', formParser, async (req, res, next) => {
  console.log('here')
  let finalLocation, mimetype
  const randomId = Date.now()

  if (req.files.filetoupload.name) {
    const oldpath = req.files.filetoupload.path
    const type = req.files.filetoupload.name.split('.').slice(-1)[0].toLowerCase()
    if (!validFileTypes.includes(type)) {
      return res.status(403).render('error', {
        error: new Error('Unsupported file format!')
      })
    }
    const newpath = path.join(__dirname, '..', '..', 'public', 'feeds', `${req.session.user._id}_${randomId}.${type}`)
    finalLocation = `/feeds/${req.session.user._id}_${randomId}.${type}`

    mimetype = mime.lookup(req.files.filetoupload.name).split('/')[1]
    mv(oldpath, newpath, (error) => {
      if (error) {
        console.log(error)
      }
    })
  }

  const newPost = new Post({
    author: req.session.user._id,
    staticUrl: finalLocation,
    caption: req.body.caption,
    category: req.body.type,
    type: mimetype,
    createdAt: new Date(),
    onModel: req.session.user.usertype
  })

  try {
    await newPost.save()
  } catch (error) {
    return res.status(500).render('error', {
      error: new Error('Failed to save post. Please try again!')
    })
  }

  let user

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

  user.posts.push(newPost._id)
  await user.save()
  console.log(bgBlueBright('Post saved successfully'))
  res.redirect('/')
})

router.get('/delete/:id', async (req, res, next) => {
  try {
    await Post.findOneAndDelete({ _id: req.params.id })
  } catch (error) {
    res.status(500).render('error', {
      error: new Error('Error deleting post.')
    })
  }

  let user
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

  user.posts = _.without(user.posts, (post) => post._id.equals(req.params.id))
  await user.save()

  res.redirect('/')
})

module.exports = router
