'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
  id: {type: String},
  participants: [{type: Schema.Types.ObjectId, ref: 'User'}]
});

module.exports = ConversationSchema;