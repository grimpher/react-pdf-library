const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  preferences: {
    type: Object,
    required: true
  },
  stats: {
    type: Object,
    required: true
  },
  firstName: {
    type: String,
    require: true
  }
})

module.exports = mongoose.model('User', userSchema)