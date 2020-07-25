const mongoose = require('mongoose')
const {
  db: { connectionUri }
} = require('../config')

mongoose.connect(connectionUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const batchSchema = mongoose.Schema({
  createdOn: String,
  startDate: String,
  endDate: String,
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId
    }
  ],
  slot: {
    type: Number,
    enum: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  }
})

module.exports = mongoose.model('Batch', batchSchema)
