'use strict';

const db = require(__base + 'app/libs/database');
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');

module.exports.createConversation = (req, res) => {
  const userid = req.body.userid;
  const contactid = req.body.contactid;

  db.UserModel.find({$or: [{id: userid}, {id: contactid}]}, (err, users) => {
    if (users) {
      const uid1 = users[0]._id;
      const uid2 = users[1]._id;
      const participants = [uid1, uid2];
      db.ConversationModel.find(
          {participants: participants}, (errConv, foundConv) => {
            if (foundConv && foundConv.length === 0) {
              const conversation = {id: uuid(), participants: participants};
              db.ConversationModel.create(conversation, (createErr, conv) => {
                if (conv) {
                  console.log(conv);
                  return res.status(200).json({conversation: conv});
                } else {
                  console.error(createErr);
                  return res.status(500).json({message: 'error'});
                }
              });
            } else {
              return res.status(200).json({conversation: foundConv});
            }
          });
    } else {
      console.error(err);
      return res.status(500).json({message: 'error'});
    }
  });
};

module.exports.addMessage = (token, message, conversation) => {
  const decoded = jwt.decode(token);
  const userid = decoded.userid;
  let participantSockets;
  db.ConversationModel.findOne({id: conversation})
      .populate('participants')
      .exec((err, conv) => {
        if (conv) {
          const conversationId = conv._id;
          const msg = {
            id: uuid(),
            sender: userid,
            conversation: conversationId,
            content: message
          };
          db.MessageModel.create(msg, (createErr, createdMsg) => {
            if (createdMsg) {
              participantSockets = conv.participants.socketId;
            } else {
              console.error(createErr);
            }
          });
        } else {
          console.error(err);
        }
      });
  return participantSockets;
};

module.exports.getMessages = (req, res) => {
  const convId = req.body.conversation;

  db.ConversationModel.findOne({id: convId}, (err, conv) => {
    if (conv) {
      db.MessageModel.find({conversation: conv._id}, (findErr, msgs) => {
        if (msgs) {
          return res.status(200).json({messages: msgs});
        } else {
          return res.status(500).json({message: 'not found'});
        }
      });
    } else {
      console.error(err);
      return res.status(500).json({message: 'error'});
    }
  });
};

module.exports.getConversations = (req, res) => {
  const uid = req.body.userid;
  db.UserModel.findOne({id: uid}, (err, user) => {
    if (user) {
      db.ConversationModel.find({participants: user._id}, (errConv, convs) => {
        if (convs) {
          return res.status(200).json({conversations: convs});
        } else {
          console.error(errConv);
          return res.status(500).json({message: errConv});
        }
      });
    } else {
      console.log(err);
      return res.status(500).json({message: err});
    }
  });
};