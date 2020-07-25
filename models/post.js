const mongoose = require('mongoose')
const {
  db: { connectionUri }
} = require('../config')

mongoose.connect(connectionUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const commentSchema = mongoose.Schema({
  by: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  text: {
    type: String,
    required: [true, 'Comment must have a body']
  },
  onPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  onModel: {
    type: String,
    enum: ['Admin', 'Teacher', 'User']
  }
})

const likeSchema = mongoose.Schema({
  by: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    enum: ['Admin', 'Teacher', 'User']
  },
  onPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }
})

const postSchema = mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  staticUrl: String,
  caption: String,
  category: {
    type: String,
    enum: ['announcement', 'moment', 'engagement', 'thought', 'query', 'news']
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Like'
    }
  ],
  type: String,
  createdAt: String,
  onModel: {
    type: String,
    enum: ['Admin', 'Teacher', 'User']
  }
})

const Comment = mongoose.model('Comment', commentSchema)
const Like = mongoose.model('Like', likeSchema)
const Post = mongoose.model('Post', postSchema)

module.exports = {
  Comment,
  Like,
  Post
}
