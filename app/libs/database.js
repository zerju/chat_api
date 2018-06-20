'use strict';

const mongoose = require('mongoose');

function createConnection(env) {
  let dbUri;
  if (env === 'dev') {
    dbUri = 'mongodb://localhost/chat'
  } else {
    dbUri = 'mongodb://localhost/chat'
  }
  return mongoose.createConnection(dbUri);
}

// connect to db
const dbConnection = createConnection('dev');
module.exports.connection = dbConnection;

// create models
const UserSchema = require(__base + 'app/models/user');
module.exports.UserModel = dbConnection.model('User', UserSchema);

const ConversationSchema = require(__base + 'app/models/conversation');
module.exports.ConversationModel =
    dbConnection.model('Conversation', ConversationSchema);

const MessageSchema = require(__base + 'app/models/message');
module.exports.MessageModel = dbConnection.model('Message', MessageSchema);


module.exports.disconnect = () => {
  dbConnection.close();
};