const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())
app.use(express.static('public'))

// MongoDB connection
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: String
});
const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
});
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Add new user
app.post('/api/users', (req, res) => {
  const username = req.body.username
  console.log(username)
  const newUser = new User({ username })
  newUser.save().then((savedUser) => {
     res.json({
       username: savedUser.username,
       _id: savedUser._id,
     });
  }).catch((err) => {
    res.json({ error: err.message });
  });
})

// GET all users
app.get('/api/users', (req, res) => {
  User.find().then((users) => {
    res.json(users);
  }).catch((err) => {
    res.json({ error: err.message });
  });
});


app.post('/api/users/:_id/exercises', async(req, res) => {
  const userId = req.params._id
  const description = req.body.description
  const duration = req.body.duration
  const date = req.body.date ? new Date(req.body.date) : new Date()

  // get user whose _id matches userId
  const user = await User.findById(userId).exec()
  console.log(user)
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }


  const newExercise = new Exercise({ 
    userId: user._id,
    description,
     duration,
      date
     })
  newExercise.save().then((savedExercise) => {
    res.json({
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date.toDateString(),
      _id: savedExercise._id,
    });
  }).catch((err) => {
    res.json({ error: err.message });
  });
})

app.get('/api/users/:_id/logs', async(req, res) => {
  const {_id} = req.params;
  const {from, to, limit} = req.query;

  try{
    const user = await User.findById(_id)
    let query = Exercise.find({userId: _id});

    if(from){
      query = query.where('date').gte(from);
    }
    if(to){
      query = query.where('date').lte(to);
    }
    if(limit){
      query = query.limit(parseInt(limit));
    }
    const excerises = await query.exec();
    
    const response ={
      username: user.username,
      count: excerises.length,
      _id: user._id,
      log: excerises.map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      })),
    }
    res.json(response);
  }catch(err){
    res.json({error: err.message})
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
