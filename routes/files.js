const express = require('express')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const pdf = require("pdf-extraction");

// MIDDLEWARES
const authorize = require('../middlewares/authorize')
const getDate = require('../middlewares/getDate')

// MULTER SETUP
const storage = multer.diskStorage({
  destination: 'public/files/',
  filename: (req, file, cb) => {
    const timestamp = (new Date()).getTime()
    cb(null, file.originalname.replace('.pdf', '-' + timestamp + '.pdf'))
  }
})
const upload = multer({ storage })

// MODELS
const File = require('../models/File')
const User = require('../models/User')

const router = new express.Router()

const handleError = (err) => {
  console.log(err)
}

// POST A NEW FILE
router.post('/', authorize(), upload.single('pdf'), async (req, res) => {

  let lastFile
  try {
    lastFile = await File.findOne({}).sort('-niceId')
  } catch (err) {
    console.log(err)
    return res.status(500)
  }
  
  const pdfBuffer = fs.readFileSync(path.resolve(req.file.path))

  pdf(pdfBuffer)
    .then(data => {

      // create file instance
      const newFile = {
        originalName: req.file.originalname,
        path: req.file.path.replace(/\\/g, '/'),
        niceId: lastFile ? lastFile.niceId + 1 : 1,
        niceName: req.file.originalname,
        pagesRead: 0,
        totalPages: data.numpages,
        metadata: {
          ...data.info
        },
        ownerEmail: req.user.email
      }
      const fileDocument = new File(newFile)

      // save file instance to DB
      fileDocument.save()
        .then(() => {
          res.json({ message: 'success', newFile })
        })
        .catch(handleError)
    })
    .catch(err => {
      console.error(err)
    })
})

// GET ALL FILES
router.get('/', authorize(), (req, res) => {
  const allFilesQuery = File.find({ ownerEmail: req.user.email })

  allFilesQuery.exec()
    .then((data) => {
      res.json(data)
    })
    .catch(handleError)
})

// GET SINGLE FILE
router.get('/:id', authorize(), (req, res) => {
  const { id } = req.params

  File.findOne({ niceId: id })
    .then( file => {
      if (file) {
        if (file.ownerEmail != req.user.email) return res.sendStatus(401)
        return res.json({ file })
      } else {
        res.sendStatus(204) // none found
      }
    })
    .catch(handleError)
})

// DELETE SINGLE FILE
router.delete('/:id', authorize(), (req, res) => {
  const { id } = req.params

  File.findOneAndRemove({ niceId: id, ownerEmail: req.user.email }, {useFindAndModify: false})
    .then(removedFile => {
      // remove file from filesystem
      try {
        fs.unlink(path.resolve(removedFile.path), (err) => {
          if (err) handleError(err)
        })
      } catch (err) {
        handleError(err)
      }
      // end

      res.json({ message: 'success' })
    })
    .catch(handleError)
})

// UPDATE SINGLE FILE
router.patch('/:id', [authorize(), getDate()], async (req, res) => {
  const { id } = req.params

  let file = {}
  try {
    file = await File.findOne({ niceId: id, ownerEmail: req.user.email})
    let changes = {}
    if (req.body.niceName) changes.niceName = req.body.niceName

    if (req.body.pagesRead) {
      changes.pagesRead = req.body.pagesRead
    }
    
    updatedFile = await File.update({ niceId: id, ownerEmail: req.user.email }, changes)
    
    if (req.body.pagesRead) {
      const pagesReadDifference = req.body.pagesRead - file.pagesRead
      const userToUpdate = await User.findOne({ email: req.user.email })
      let newUserPagesRead = pagesReadDifference
      if (typeof userToUpdate.stats[req.date.today.string] !== 'undefined') {
        const userStats = userToUpdate.stats
        newUserPagesRead += userStats[req.date.today.string].pages
      }
      const newStats = {
        ...userToUpdate.stats,
        [req.date.today.string]: {
          pages: newUserPagesRead,
          minutes: userToUpdate.stats[req.date.today.string].minutes
        }
      }
      const updatedUser = await User.updateOne({ email: req.user.email }, {
        stats: newStats
      })
    }

    if (req.body.minutesOfReading && req.body.minutesOfReading > 0) {
      const userToUpdate = await User.findOne({ email: req.user.email })
      let minutesOfReading = req.body.minutesOfReading
      if (typeof userToUpdate.stats[req.date.today.string] !== 'undefined') {
        const userStats = userToUpdate.stats
        minutesOfReading += userStats[req.date.today.string].minutes
      }
      
      const newStats = {
        ...userToUpdate.stats,
        [req.date.today.string]: {
          pages: userToUpdate.stats[req.date.today.string].pages,
          minutes: minutesOfReading
        }
      }
      const updatedUser = await User.updateOne({ email: req.user.email }, {
        stats: newStats
      })
    }
    
    return res.status(200).json({ updatedFile })

  } catch (err) {
    console.log(err)
    return res.sendStatus(500)
  }
})

module.exports = router