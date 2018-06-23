'use strict';

const db = require(__base + 'app/libs/database');
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');

module.exports.createConversation = (req, res) => {
  const participantIds = req.body.participantIds;
  participantIds.push(req.user.userId);
  const mapped = participantIds.map((x) => {
    return {id: x};
  });

  db.UserModel.find({$or: mapped}, (err, users) => {
    if (users) {
      const participants = users.map((x) => x._id);
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

module.exports.addMessage = (token, message, conversation, callback) => {
  const decoded = jwt.decode(token);
  const userid = decoded.userId;
  let participantSockets = [];
  db.UserModel.findOne({id: userid}, (errUser, user) => {
    db.ConversationModel.findOne({id: conversation})
        .populate('participants')
        .exec((err, conv) => {
          if (conv) {
            const conversationId = conv._id;
            const msg = {
              id: uuid(),
              sender: user._id,
              conversation: conversationId,
              content: message
            };
            db.MessageModel.create(msg, (createErr, createdMsg) => {
              if (createdMsg) {
                for (let part of conv.participants) {
                  if (part.id !== userid) {
                    participantSockets.push(part.socketId);
                  }
                }
                callback(participantSockets);
              } else {
                console.error(createErr);
              }
            });
          } else {
            console.error(err);
          }
        });
  });
};

module.exports.getMessages = (req, res) => {
  const convId = req.body.conversation;
  db.ConversationModel.findOne({id: convId}, (err, conv) => {
    if (conv) {
      db.MessageModel.find({conversation: conv._id})
          .select({_id: 0, conversation: 0})
          .populate(
              'sender', {_id: 0, id: 1, username: 1, image: 1, statuses: 1})
          .exec((findErr, msgs) => {
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