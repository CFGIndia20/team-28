const express = require('express')
const Fuse = require('fuse.js')
const marked = require('marked')
const q = require('queue')({ autostart: true })
const ta = require('time-ago')
const _ = require('underscore')
const router = express.Router()
const { Admin, Comment, Post, Like, User, Teacher } = require('../../../models')

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

router.get('/v1/posts', async (req, res) => {
  if (!req.session.user) {
    res.sendStatus(404)
  } else {
    const page = req.query.page || 1
    let posts
    try {
      posts = await Post.find({})
        .populate('author')
        .populate({
          path: 'comments',
          populate: {
            path: 'by'
          }
        })
        .lean()
        .exec()
    } catch (error) {
      console.log(error)
      return res.sendStatus(500)
    }

    posts = _.sortBy(posts, (eachPost) => new Date(eachPost.createdAt)).reverse()
    posts = posts.slice(page === 1 ? 0 : 10 * (page - 1), page === 1 ? 10 : undefined)
    res.status(200).send(
      _.each(posts, (post) => {
        post.timeago = ta.ago(post.createdAt)
        post.caption = marked(post.caption)
      })
    )
  }
})

router.post('/v1/comment', async (req, res, next) => {
  if (!req.session.user) {
    return res.status(400).send('Unauthorized')
  }

  const comment = new Comment({
    by: req.session.user._id,
    text: req.body.text,
    onPost: req.body._id,
    onModel: req.session.user.usertype
  })

  const post = await Post.findById(req.body._id)
  post.comments.push(comment._id)
  await comment.save()
  await post.save()
  return res.json({
    by: {
      username: req.session.user.username,
      usertype: req.session.user.usertype
    },
    amount: post.comments.length
  })
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

router.post('/v1/like', async (req, res, next) => {
  if (!req.session.user) {
    res.status(403).send('Unauthorized')
  }

  let like
  try {
    like = await Like.findOne({
      by: req.session.user._id,
      onModel: req.session.user.usertype,
      onPost: req.body._id
    }).exec()
  } catch (error) {
    return res.status(500).render('error', {
      error: new Error('Database error')
    })
  }

  const post = await Post.findById(req.body._id).exec()

  if (like) {
    await Like.deleteOne({ _id: like._id })
    post.likes = _.reject(post.likes, (eachLike) => eachLike.equals(like._id))
    await post.save()
    return res.status(202).send({
      event: true,
      msg: 'Unliked',
      amount: post.likes.length
    })
  } else {
    like = new Like({
      by: req.session.user._id,
      onModel: req.session.user.usertype,
      onPost: req.body._id
    })
    await like.save()
    post.likes.push(like._id)
    await post.save()
    return res.status(202).send({
      event: true,
      msg: 'Liked',
      amount: post.likes.length
    })
  }
})

module.exports = router
