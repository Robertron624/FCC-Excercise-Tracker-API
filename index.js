const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const { query } = require('express')

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
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
})

const User = mongoose.model('User', userSchema)

// Excerciese Schema
const exerciceSchema = new mongoose.Schema({
  userId:{
    type: String,
    unique: false,
    required: false
  },
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
    username: username,
    _id: user._id
  }))
  .catch(error => res.status(400).json({
    error: error.message
  }))
})

// get all users
app.get("/api/users", (req,res)=>{
  User.find().exec((err, users)=>{
    if(err) res.status(400).json({message: err.message})
    res.json(users)
  })
})

// Add excercise to user

/* Response object:
{
  "_id": "634cd6550abd4209c4114ca0",
  "username": "mantos",
  "date": "Thu Jun 23 2022",
  "duration": 10,
  "description": "brazos"
}
*/

app.post("/api/users/:_id/exercises", (req, res)=>{
  const userId = req.params._id

  const description = req.body.description
  const duration = req.body.duration
  let date = req.body.date

  // if(!date){
  //   date = new Date()
  // }

  // date = new Date(date)

  User.findById(userId, (err, document)=>{
    if(err) res.status(400).json({error: err.message})

    const newExercise = new Excercise({
      userId: userId,
      description: description,
      duration: duration,
      date: new Date(date),
    })

    newExercise.save()
    .then((data)=>{
      res.json({
        _id: document._id.toString(),
        username: data.username,
        date: date.toDataString(),
        duration: duration,
        description: description
      })
    })
    .catch(err => {
      res.status(400).json({error: err.message})
    })
  })
})

// Get logs
/*
Response object:
{
  "_id": "634da80400a0e809ea0ad3e1",
  "username": "kolok",
  "count": 1,
  "log": [
    {
      "description": "piernas",
      "duration": 10,
      "date": "Thu Jun 23 2022"
    }
  ]
}
*/ 

app.get("/api/users/:id/logs", (req, res) => {
  const userId = req.params.id
  const limit = Number(req.query.limit)
  const from = Number(req.query.from)
  const to = Number(req.query.to)

  console.log('from and to: ', from, to)

  User.findById(userId, (err, userData)=>{
    if(err || !userData){
      res.send("Could not found user")
    }
    else{
      let dateObj = {}

      if(from){
        dateObj["$gte"] = new Date(from)
      }
      if(to){
        dateObj["$lte"] = new Date(to)
      }

      let filter = {
        userId: userId
      }

      if(from || to){
        filter.date = dateObj
      }

      let nonNullLimit = limit ?? 500

      Excercise.find(filter).limit(+nonNullLimit)
      .exec((err, data)=>{
        if(err || !data){
          res.json([])
        }
        else{
          const count = data.length
          const rawLog = data
          const {username, _id} = userData
          const log= rawLog.map((l) => ({
            description: l.description,
            duration: l.duration,
            date: l.date.toDateString()
          }))
          res.json({username, count, _id, log})
        }
      })

    }
  })
}) 

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
