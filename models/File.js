const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema({
  originalName: String,
  path: String,
  niceId: Number,
  niceName: String,
  metadata: Object,
  pagesRead: Number,
  totalPages: Number,
  ownerEmail: String
})

module.exports = mongoose.model('File', fileSchema)