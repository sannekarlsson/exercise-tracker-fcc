const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExerciseSchema = new Schema({
  user: {
    type: String,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Format date when access as object 
ExerciseSchema.path('date').get(date => {
  return date.toDateString();
});

ExerciseSchema.set('toJSON', { getters: true });
ExerciseSchema.set('toObject', { getters: true });


module.exports = mongoose.model('Exercise', ExerciseSchema);