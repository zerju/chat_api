'use strict';

const db = require(__base + 'app/libs/database');
const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports.getConversationById = (req, res) => {
  const conversationId = req.body.conversationId;
  db.ConversationModel.findOne({id: conversationId})
      .populate('participants', {_id: 0, image: 1, username: 1, id: 1})
      .exec((errConv, conv) => {
        if (conv) {
          return res.status(200).json({conversation: conv});
        } else {
          return res.status(500).json({message: 'Server error'});
        }
      });
};

module.exports.createConversation = (req, res) => {
  const participantIds = req.body.participantIds;
  participantIds.push(req.user.userId);
  const mapped = participantIds.map((x) => {
    return {id: x};
  });

  db.UserModel.find({$or: mapped}, (err, users) => {
    if (users) {
      const participants = users.map((x) => new ObjectId(x._id));
      db.ConversationModel.find({participants: participants})
          .populate('participants', {_id: 0, image: 1, username: 1, id: 1})
          .exec((errConv, foundConv) => {
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
              return res.status(200).json({conversation: foundConv[0]});
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
            const conversationId = new ObjectId(conv._id);
            const msg = {
              id: uuid(),
              sender: new ObjectId(user._id),
              conversation: conversationId,
              content: message
            };
            db.MessageModel.create(msg, (createErr, createdMsg) => {
              if (createdMsg) {
                db.MessageModel.findOne({id: createdMsg.id})
                    .select({_id: 0, conversation: 0})
                    .populate('sender', {_id: 0, id: 1, username: 1, image: 1})
                    .exec((findErr, msgs) => {
                      console.log(msgs);
                      if (msgs) {
                        for (let part of conv.participants) {
                          participantSockets.push(part.socketId);
                        }
                        callback(participantSockets, msgs);
                      } else {
                        console.error(findErr);
                      }
                    });

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
  const userId = req.user.userId;
  const participantIds = req.body.participantIds;
  participantIds.push(req.user.userId);
  const mapped = participantIds.map((x) => {
    return {id: x};
  });

  db.UserModel.find({$or: mapped}, (err, users) => {
    if (users) {
      const participants = users.map((x) => new ObjectId(x._id));
      db.ConversationModel.findOne(
          {participants: participants}, (errConv, foundConv) => {
            console.log(foundConv);
            db.MessageModel.find({conversation: foundConv._id})
                .select({_id: 0, conversation: 0})
                .populate('sender', {_id: 0, id: 1, username: 1, image: 1})
                .exec((findErr, msgs) => {
                  console.log(msgs);
                  if (msgs) {
                    return res.status(200).json({messages: msgs});
                  } else {
                    return res.status(500).json({message: 'Server error'});
                  }
                });
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
      db.ConversationModel.find(
          {participants: new ObjectId(user._id)}, (errConv, convs) => {
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