const express = require('express')
const app = express()
const mongoose = require('mongoose')
const path = require('path')

require('dotenv').config()

// MIDDLEWARES
const morgan = require('morgan')
const cors = require('cors')
const bodyParser = require('body-parser')

app.use(cors())
app.use(bodyParser.json())
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: false }))

// HOST STATIC FILES
app.use('/public/files', express.static(path.join(__dirname, 'public/files')))
app.use('/public/pdfJs', express.static(path.join(__dirname, 'public/pdfJs')))

// ROUTES
const apiRouter = new express.Router()

const filesRouter = require('./routes/files')
const authRouter = require('./routes/auth')
const usersRouter = require('./routes/users')

apiRouter.use('/files', filesRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/users', usersRouter)

app.use('/api', apiRouter)

app.use(express.static(path.join(__dirname, 'public/client')))
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

// MONGODB SETUP
mongoose.connect(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mastercluster-k61lq.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
  { useNewUrlParser: true }
).then(() => {

  // SERVER SETUP
  app.listen(process.env.PORT, () => {
    console.log('API server up: 127.0.0.1:' + process.env.PORT)
  })

}).catch((err) => {
  console.log(err)
})