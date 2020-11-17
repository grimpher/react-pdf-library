const express = require('express')
const Schema = require('validate')

const User = require('../models/User')

const authorize = require('../middlewares/authorize')
const router = new express.Router()

router.get(['/', '/:email'], authorize(), async (req, res) => {
  const email = req.params.email || req.user.email

  if (email !== req.user.email) return res.sendStatus(401)

  try {
    const user = await User.findOne({ email }).select('stats email preferences firstName')

    if (user) {
      return res.status(200).json({ user })
    }
  } catch (err) {
    console.log(err)
    return res.status(500)
  }
})

router.patch('/preferences', authorize(), async (req, res) => {
  const { email } = req.user

  let oldUserPreferences = {}
  try {
    oldUserData = await User.findOne({ email })
    oldUserPreferences = oldUserData.preferences

  } catch (err) {
    return res.sendStatus(500)
  }
  const newPreferences = Object.assign({}, oldUserPreferences, req.body)
  newPreferences.dailyGoals = Object.assign({}, newPreferences.dailyGoals, req.body.dailyGoals)

  changesSchema = new Schema({
    dailyGoals: {
      type: Object,
      pages: {
        type: Number,
        required: false
      },
      minutes: {
        type: Number,
        required: false
      }
    }
  })

  try {
    changesSchema.validate(newPreferences)
  } catch (err) {
    return res.status(400).json({ message: 'Invalid parameters', err })
  }

  try {
    await User.updateOne({ email }, { preferences: newPreferences })
    return res.status(200).json({ newPreferences })
  } catch (err) {
    console.log(err)
    return res.status(500).send()
  }
})

module.exports = router