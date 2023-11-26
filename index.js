const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

// MongoDB connection
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    require: [true, "Username must be provided"],
    unique: true,
  },
  exercises: [
    {
      description: String,
      duration: Number,
      date: Date,
    },
  ]
});
const exerciseSchema = new mongoose.Schema({
  userId: {
    type: String,
    require: [true, 'User ID must be provided'],
  },
  username: {
    type: String,
    require: [true, 'Username must be provided'],
  },
  description:{
    type: String,
    require: [true, 'Description must be provided'],
  },
  duration: {
    type: Number,
    require: [true, 'Duration must be provided'],
  },
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


app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const exercise = {
      description,
      duration,
      date: new Date(date),
    };

    user.exercises.push(exercise);
    await user.save();

    res.json({
      username: user.username,
      _id: user._id,
      exercises: user.exercises,
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// app.post("/api/users/:_id/exercises", async (req, res) => {
//   const { _id } = req.params;
//   const { description, duration, date } = req.body;

//   try {
//     const user = await User.findById(_id);
//     const exercise = new Exercise({
//       userId: user._id,
//       description,
//       duration,
//       date: new Date(date),
//     });

//     const savedExercise = await exercise.save();

//     res.json({
//       username: user.username,
//       description: savedExercise.description,
//       duration: savedExercise.duration,
//       date: savedExercise.date.toDateString(),
//       _id: user._id,
//     });
//   } catch (err) {
//     res.json({ error: err.message });
//   }
// });


app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    let query = Exercise.find({ userId: _id });

    if (from) {
      query = query.where("date").gte(from);
    }
    if (to) {
      query = query.where("date").lte(to);
    }
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    const excerises = await query.exec();

    let userLogs = excerises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    }));  

    res.json({
      username: user.username,
      count: userLogs.length,
      _id: user._id,
      log: userLogs,
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
