const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const validator = require('validator')

const {
  db: { connectionUri }
} = require('../config')

mongoose.connect(connectionUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// Notification Schema
const notificationSchema = mongoose.Schema({
  msg: String,
  time: String,
  for: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  link: String,
  onModel: {
    type: String,
    enum: ['Admin', 'Teacher', 'User']
  }
})

// Admin Schema
const adminSchema = mongoose.Schema({
  usertype: {
    type: String,
    default: 'Admin'
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    validate: {
      validator: (v) => validator.isEmail(v)
    }
  },
  profilePicture: {
    type: String,
    default: '/images/admin.png'
  },
  notifications: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }
  ],
  chats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    }
  ]
})

adminSchema.methods.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}

adminSchema.methods.validPassword = (password) => {
  return bcrypt.compareSync(password, this.local.password)
}

// User Schema
const userSchema = mongoose.Schema({
  usertype: {
    type: String,
    default: 'User'
  },
  username: String,
  accessToken: String,
  refreshToken: String,
  general: {
    name: String,
    age: Number,
    birthDate: String,
    picture: String,
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      validate: {
        validator: (v) => validator.isMobilePhone(v)
      }
    },
    location: {
      address: String,
      postalCode: String,
      city: String,
      region: String
    }
  },
  education: {
    type: Array,
    default: []
    /*
        "institution": "University",
        "area": "Software Development",
        "studyType": "Bachelor",
        "startDate": "2011-01-01",
        "endDate": "2013-01-01",
        "gpa": "4.0",
        "courses": [
          "DB1101 - Basic SQL"
        ]
    */
  },
  chats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    }
  ],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }
  ],
  notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification'
    }
  ]
})

// Teacher Schema
const teacherSchema = mongoose.Schema({
  usertype: {
    type: String,
    default: 'Teacher'
  },
  username: String,
  password: String,
  general: {
    name: String,
    birthDate: String,
    picture: String,
    gender: String,
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      validate: {
        validator: (v) => validator.isMobilePhone(v)
      }
    },
    location: {
      address: String,
      postalCode: String,
      city: String,
      region: String
    }
  },
  chats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    }
  ],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }
  ],
  notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification'
    }
  ],
  shift: {
    type: String,
    enum: ['morning', 'afternoon']
  },
  batches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  }]
})

teacherSchema.methods.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}

teacherSchema.methods.validPassword = (password) => {
  return bcrypt.compareSync(password, this.local.password)
}

module.exports = {
  Admin: mongoose.model('Admin', adminSchema),
  User: mongoose.model('User', userSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Teacher: mongoose.model('Teacher', teacherSchema)
}
