'use strict';

const db = require(__base + 'app/libs/database');
const utils = require(__base + 'app/libs/utils');
const jwt = require('jsonwebtoken');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports.getUser = (req, res) => {
  db.UserModel.findOne({id: req.user.userId})
      .populate(
          'contactRequests.from',
          {'_id': 0, 'username': 1, 'image': 1, 'id': 1})
      .populate(
          'friends',
          {'_id': 0, 'id': 1, 'username': 1, 'image': 1, 'statuses': 1})
      .select({'_id': 0, 'password': 0, '__v': 0, 'created': 0})
      .exec((err, user) => {
        if (user) {
          return res.status(200).json({user: user});
        } else {
          return res.status(500).json({message: 'Server error'});
        }
      });
};

module.exports.getAllUsers = (req, res) => {
  const userid = req.user.userId;
  const search = req.query.search;
  const findSearch = {
    $and: [{username: {$regex: '.*' + search + '.*'}}, {id: {$nin: [userid]}}]
  };
  const query = db.UserModel.find(findSearch)
                    .limit(15)
                    .select({'username': 1, 'image': 1, '_id': 0, 'id': 1});
  query.exec((err, users) => {
    console.log(err);
    if (users) {
      return res.status(200).json(users);
    } else {
      return utils.sendRequestError(res, 404, ['Users not found']);
    }
  });
};

module.exports.sendContactRequest = (req, res) => {
  const userid = req.user.userId;
  const contactid = req.body.contactid;
  db.UserModel.findOne({id: contactid})
      .exec()
      .then((contact) => {
        db.UserModel.findOne({id: userid})
            .exec()
            .then((user) => {
              db.UserModel
                  .update({_id: new ObjectId(contact._id)}, {
                    '$push': {contactRequests: {from: new ObjectId(user._id)}}
                  })
                  .exec()
                  .then((saved) => {
                    return res.status(200).json({message: 'Request sent'});
                  })
                  .catch((err) => {
                    return utils.sendRequestError(res, 500, ['Server error']);
                  });
            })
            .catch((err) => {
              return utils.sendRequestError(res, 500, ['Server error']);
            });
      })
      .catch((err) => {
        return utils.sendRequestError(res, 500, ['Server error']);
      });
};

module.exports.addContact = (req, res) => {
  const userid = req.user.userId;
  console.log(userid);
  const response = req.body.response;
  const contactid = req.body.response.contactid;

  db.UserModel.findOne({id: contactid})
      .exec()
      .then((contact) => {
        db.UserModel.findOne({id: userid})
            .exec()
            .then((user) => {
              const requests = user.contactRequests.slice();
              console.log(user.contactRequests[0].from, user._id);
              const index = requests.map((x) => x.from.toString())
                                .indexOf(contact._id.toString());
                                console.log(index);
              user.contactRequests[index].responded = true;
              user.save();
              console.log(user);
              if (!response.response) {
                return res.status(200).json({message: 'User denied'});
              }
              db.UserModel
                  .update(
                      {_id: new ObjectId(user._id)},
                      {'$push': {'friends': new ObjectId(contact._id)}})
                  .exec()
                  .then((suc) => {
                    db.UserModel
                        .update(
                            {_id: new ObjectId(contact._id)},
                            {'$push': {'friends': new ObjectId(user._id)}})
                        .exec()
                        .then((suc2) => {
                          return res.status(200).json({message: 'User added'});
                        })
                        .catch((err) => {
                          return utils.sendRequestError(
                              res, 500, ['User update error']);
                        });
                  })
                  .catch((err) => {
                    return utils.sendRequestError(
                        res, 500, ['Contact update error']);
                  });
            })
            .catch((err2) => {
              return utils.sendRequestError(res, 500, [err2]);
            });
      })
      .catch((err) => {
        return utils.sendRequestError(res, 500, ['Contact find error']);
      });
};

module.exports.getContacts = (req, res) => {
  const userid = req.user.userId;
  db.UserModel.findOne({id: userid})
      .populate('friends', {
        id: 1,
        username: 1,
        image: 1,
        statuses: 1,
        _id: 0,
      })
      .exec((err, user) => {
        if (user) {
          return res.status(200).json({friends: user.friends});
        } else {
          return utils.sendRequestError(res, 500, ['Server error']);
        }
      });
};

module.exports.addSocketId = (decoded, socketId) => {
  if (socketId) {
    const userid = decoded.userId;
    db.UserModel.findOne({id: userid}, (err, user) => {
      if (user) {
        user.socketId = socketId;
        user.save((userError) => {
          if (userError) console.error(userError);
        });
      } else {
        console.error(err);
      }
    });
  }
};