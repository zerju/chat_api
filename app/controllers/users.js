'use strict';

const db = require(__base + 'app/libs/database');
const utils = require(__base + 'app/libs/utils');

module.exports.getUser = (req, res) => {
  db.UserModel.findOne({id: req.user.userId})
      .populate('contactRequests.from', {'_id': 0, 'username': 1, 'image': 1})
      .populate('friends', {'_id': 0, 'username': 1, 'image': 1, 'statuses': 1})
      .select({'_id': 0, 'password': 0, '__v': 0, 'created': 0})
      .exec()
      .then((user) => {
        return res.status(200).json({user: user});
      });
};

module.exports.getAllUsers = (req, res) => {
  const userid = req.user.userId;
  const search = req.query.search;
  const findSearch = {
    $and: [{username: {$regex: '.*' + search + '.*'}}, {id: {$nin: [userid]}}]
  };
  const query =
      db.UserModel.find(findSearch)
          .limit(15)
          .select({'username': 1, 'image': 1, '_id': 0, 'id': 1, '__v': 0});
  query.exec((err, users) => {
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
                  .update(
                      {_id: contact._id},
                      {'$push': {contactRequests: {from: user._id}}})
                  .exec()
                  .then((saved) => {
                    return res.status(200).json({message: 'Request sent'});
                  })
                  .catch(
                      (err) => {return utils.sendRequestError(
                          res, 500, ['Server error'])});
            })
            .catch((err) => {
              return utils.sendRequestError(res, 500, ['Server error']);
            });
      })
      .catch((err) => {
        return utils.sendRequestError(res, 500, ['Server error']);
      });
  ;
};

module.exports.addContact = (req, res) => {
  const userid = req.user.userId;
  const contactid = req.body.contactid;
  db.UserModel.findOne({id: contactid})
      .exec()
      .then((contact) => {
        db.UserModel.findOne({id: userid})
            .exec()
            .then((user) => {
              db.UserModel
                  .update({_id: contact._id}, {'$push': {'friends': user._id}})
                  .exec()
                  .then((suc) => {
                    db.UserModel
                        .update(
                            {_id: user._id},
                            {'$push': {'friends': contact._id}})
                        .exec()
                        .then((suc2) => {
                          return res.status(200).json({message: 'User added'});
                        })
                        .catch((err) => {
                          return utils.sendRequestError(
                              res, 500, ['Server error']);
                        });
                    ;
                  })
                  .catch((err) => {
                    return utils.sendRequestError(res, 500, ['Server error']);
                  });
              ;
            })
            .catch((err) => {
              return utils.sendRequestError(res, 500, ['Server error']);
            });
        ;
      })
      .catch((err) => {
        return utils.sendRequestError(res, 500, ['Server error']);
      });
  ;
};

module.exports.getContacts = (req, res) => {
  const userid = req.user.userId;
  db.UserModel.findOne({id: userid})
      .populate('friends', {
        username: 1,
        image: 1,
        statuses: 1,
        _id: 0,
      })
      .exec()
      .then((user) => {
        res.status(200).json({friends: user.friends});
      })
      .catch((err) => {
        return utils.sendRequestError(res, 500, ['Server error']);
      });
  ;
}