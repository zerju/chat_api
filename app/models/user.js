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
  statuses: {
    online: {type: Boolean, default: true},
    banned: {type: Boolean, default: false}
  },
  group: [{type: Schema.Types.ObjectId, ref: 'Group'}],
  friends: [{type: Schema.Types.ObjectId, ref: 'User'}]
});

module.exports = UserSchema;