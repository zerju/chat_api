'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  id: {type: String},
  sender: [{type: Schema.Types.ObjectId, ref: 'User'}],
  conversation: {type: Schema.Types.ObjectId, ref: 'Conversation'},
  content: {type: String},
  sendDate: {type: Date, default: Date.now}
});

module.exports = MessageSchema;