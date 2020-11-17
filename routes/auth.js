const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User = require('../models/User')

// MIDDLEWARES
const getDate = require('../middlewares/getDate')

const router = new express.Router()

router.post('/register', getDate(), async (req, res) => {
  const { email, password, firstName } = req.body

  if (!email || !password || !firstName) {
    return res.status(400).json({ message: 'Not enough parameters to register' })
  }

  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ message: 'Invalid email' })
  }

  if (!firstName) {
    return res.status(400).json({ message: 'First name not set' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      email: email,
      firstName: firstName,
      password: hashedPassword,
      preferences: {
        dailyGoals: {
          pages: 20,
          minutes: 5
        }
      },
      stats: {
        [req.date.today.string]: {
          pages: 0,
          minutes: 0
        }
      }
    })

    if(! await User.findOne({ email })) {
      user.save()
        .then(savedUser => {
          const token = jwt.sign({ email }, process.env.AUTH_SECRET)
          res.status(201).json({ token })
        })
        .catch(err => {
          console.log(err)
          res.status(500).json({ message: 'Internal error' })
        })
    } else {
      res.status(409).json({ message: 'User already exists' })
    }

  } catch (err) {
    res.status(500).json({ message: 'Internal error' })
    throw new Error(err)
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  let user
  try{
    user = await User.findOne({ email })
  } catch (e) {
    return res.status(500).send(err)
  }
  

  if (!user) {
    return res.status(400).json({ message: 'User with this e-mail does not exist' })
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ message: 'Password incorrect' })
  }

  const token = jwt.sign({ email }, process.env.AUTH_SECRET)

  res.status(200).json({
    token
  })
})

module.exports = router