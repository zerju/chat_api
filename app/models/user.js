'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  id: {type: String},
  username: {type: String, required: true, trim: true, unique: true},
  email: {type: String, unique: true, trim: true, lowercase: true},
  password: {type: String, required: true},
  created: {type: Date, default: Date.now},
  image: {type: String, default: 'kitten.jpg'},
  statuses: {
    online: {type: Boolean, default: true},
    banned: {type: Boolean, default: false}
  },
  group: [{type: Schema.Types.ObjectId, ref: 'Group'}],
  friends: [{type: Schema.Types.ObjectId, ref: 'User'}],
  contactRequests: [{
    from: {type: Schema.Types.ObjectId, ref: 'User'},
    date: {type: Date, default: Date.now},
    responded: {type: Boolean, default: false}
  }],
  refreshToken: {type: String, required: true},
  refreshTokenExp:
      {type: Date, required: true, default: new Date(Date.now() + 12096e5)}
});

module.exports = UserSchema;