const express = require('express')
const app = express()
//const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

const User = require(__dirname + '/userModel');
const Exercise = require(__dirname + '/exerciseModel');

// Reset database 
//User.deleteMany({}, (err) => { if (err) console.log(err); console.log('deleted'); });

app.use(cors())

app.use(express.urlencoded({extended: false}))
app.use(express.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// freeCodeCamp html
app.get('/fcc', (req, res) => {
  res.sendFile(__dirname + '/views/fcc-index.html')
});

// 1. create a user by posting form data username
// returned will be an object with username and _id
app.post('/api/exercise/new-user', (req, res) => {
  
  if (!req.body || req.body.username.length === 0) {
    return res.send('Please fill in your name.');
  }
  
  // Make sure the name is not already taken
  User.find({ username: req.body.username }, (err, doc) => {
    
    if (err) return res.status(500).send(err);
    
    if (doc.length > 0) 
      return res.send('Sorry, user name not available. Try another one.');
      
    new User({ username: req.body.username })
      .save()
      .then(user => {
        res.json({ 
          _id: user._id, 
          username: user.username 
        });
      })
      .catch(err => {
        res.status(500).send(err); 
      });
          
  });

}); 

// 2. get an array of all users
app.get('/api/exercise/users', (req, res) => {
  User.find({}, '_id username')
    .then(users => {
      res.json(users);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

// 3. add an exercise to any user by posting form data
// userId(_id), description, duration, and optionally date
// If no date supplied it will use current date.
// Return the user object with the exercise fields
app.post('/api/exercise/add', (req, res) => {
  
  // Validate user id
  User.findById( req.body.userId, (err, user) => {
    if (err || !user) return res.send( 'Sorry, invalid userId. Have you created a user?' );

    // Set up the exercise properties
    let exercise = {
      user: req.body.userId,
      description: req.body.description,
      duration: req.body.duration,
    }
    
    // If date is provided add it as well
    if (req.body.date && req.body.date.length > 0) {
      exercise.date = new Date(req.body.date);
    }
  
    // Create and save Exercise
    new Exercise(exercise).save((err, doc) => {
      if (err) return res.status(500).send(err);
      
      return res.json({ 
        _id: user._id, 
        username: user.username, 
        description: doc.description, 
        duration: doc.duration, 
        date: doc.date 
      });
    });
  });
});


// 4. retrieve a full exercise log of any user by getting 
// /api/exercise/log with a parameter of userId(_id). 
// Return the user object with log and count (total exercise count).

// 5. retrieve part of the log of any user by also passing along 
// optional parameters of from & to or limit. (Date format yyyy-mm-dd, limit = int)
// GET /api/exercise/log?{userId}[&from][&to][&limit]
app.get('/api/exercise/log', (req, res) => {
  
  if (!req.query.userId) {
    return res.send('Please provide a userId. ' +
                    'Include the following in the url right after log: ?userId=YourUserId');
  }

  // https://mongoosejs.com/docs/queries.html
  let query = Exercise.find({ user: req.query.userId });
  
  req.query.from && 
    query.where('date')
         .gt(new Date(req.query.from).toISOString());
  
  req.query.to && 
    query.where('date')
         .lt(new Date(req.query.to).toISOString());
  
  req.query.limit && 
    query.limit(req.query.limit * 1);
  
  query.select('-_id -__v')
    // To access user's name 
    // https://mongoosejs.com/docs/populate.html
    .populate('user', 'username')
    .lean()
    .exec((err, exercise) => {
    
      if (err) return res.status(500).send(err);
      
      if (!exercise || exercise.length === 0) {
        return res.send('No exercises found for this user id.');
      } 
      // Result object
      let result = exercise[0].user;
      result.count = exercise.length;
    
      result.log = exercise.map(exer => {          
        return {
          description: exer.description,
          duration: exer.duration,
          date: exer.date.toDateString()
        };
          
      });
        
      res.json(result);   
  });
  
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
