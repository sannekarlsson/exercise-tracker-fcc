const mongoose = require('mongoose');
const shortid = require('shortid');

const UserSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  username: String
});

module.exports = mongoose.model('User', UserSchema);