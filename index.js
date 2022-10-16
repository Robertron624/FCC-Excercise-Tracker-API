const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true})

const db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error'))
db.once('open', () => {
  console.log('Successfully connected to the database')
})

app.use(bodyParser.urlencoded({extended:false}))

app.use(bodyParser.json())

// --------- MODELS -----------------

// User Schema
const userSchema = new mongoose.Schema({
  username: String
})

const User = mongoose.model('User', userSchema)

// Excerciese Schema
const exerciceSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: false
  },
  description: {
    type: String,
    required: true,
    unique: false
  },
  duration: {
    type: Number, 
    required: true, 
    unique: false
  },
  date: {
    type: Date,
    required: false
  },
})

const Excercise = mongoose.model('Excercise', exerciceSchema)


//--------------- Routes -----------------

// Create new user
app.post("/api/users", (req, res, next)=>{
  const {username} = req.body

  const newUser = new User({
    username: username
  })
  newUser.save()
  .then(user => res.json({
    username: username
  }))
  .catch(error => res.status(400).json({
    error: error.message
  }))
})
 

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
