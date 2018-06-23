'use strict';

const db = require(__base + 'app/libs/database');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');
const utils = require(__base + 'app/libs/utils');
const jwt = require('jsonwebtoken');
const validators = require(__base + 'app/libs/validators');
const config = require(__base + 'app/config');

// Register a new user
module.exports.register = (req, res) => {
  if (!req.body.email || !req.body.username || !req.body.password) {
    return res.status(400).json({errors: ['Data for registration missing']});
  }
  if (!validators.validateEmail(req.body.email)) {
    return res.status(400).json({errors: ['Not a valid email address']});
  } else {
    let errorMsg = [];
    const newUser = new db.UserModel(req.body);
    newUser.id = uuid();
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      db.UserModel.findOne({username: newUser.username}, (err1, user) => {
        db.UserModel.findOne({email: newUser.email}, (err2, userMail) => {
          console.log(user);
          if (err1 || err2) {
            return res.status(500).json({errors: 'Server error'});
          }
          if (user != null) {
            errorMsg.push('Username already exist');
          }
          if (userMail != null) {
            errorMsg.push('Email already exists');
          }
          if (errorMsg.length > 0) {
            return res.status(409).json({errors: errorMsg});
          } else {
            newUser.password = hash;
            newUser.refreshToken = uuid();
            db.UserModel.create(newUser, (err3, user) => {
              console.log('works?=');
              if (err3) {
                return res.status(500).json({errors: 'Server error'});
              } else {
                return res.status(200).json({message: 'User Created'});
              }
            });
          }
        });
      });
    });
  }
};

// login existing user
module.exports.login = (req, res) => {
  console.log(req.body);
  db.UserModel.findOne({username: req.body.username}, (err, user) => {
    if (user == null) {
      return utils.sendRequestError(res, 403, ['Wrong username or password']);
    }
    bcrypt.compare(req.body.password, user.password, (err, correct) => {
      if (correct) {
        const token =
            jwt.sign({userId: user.id}, config.secret, {expiresIn: 8640});
        user.accessToken = token;
        user.save((saveErr) => {
          if (saveErr) {
            return utils.sendRequestError(
                res, 500, ['Something went wrong on our side']);
          } else {
            return res.status(200).json({
              auth: true,
              user: {
                email: user.email,
                username: user.username,
                id: user.id,
                statuses: user.statuses,
                image: user.image
              },
              token: token,
              refreshToken: user.refreshToken,
              refreshTokenExp: user.refreshTokenExp
            });
          }
        });

      } else {
        utils.sendRequestError(res, 403, ['Wrong username or password']);
      }
    });
  });
};

module.exports.newAccessToken = (req, res) => {
  const accessToken = req.headers.authorization;
  const decoded = jwt.decode(accessToken);
  jwt.verify(accessToken, config.secret, (err, decodedToken) => {
    if (err) {
      const oldToken = decoded;
      db.UserModel.findOne({id: oldToken.userId})
          .exec()
          .then((user) => {
            if (Date.parse(user.refreshTokenExp) > Date.now()) {
              if (user.refreshToken === req.body.refreshToken) {
                const token = jwt.sign(
                    {userId: user.id}, config.secret,
                    {expiresIn: 8640});  // 86400
                user.accessToken = token;
                user.save((saveErr) => {
                  if (saveErr) {
                    return utils.sendRequestError(
                        res, 500, ['Something went wrong on our side']);
                  } else {
                    return res.status(200).json({newToken: token});
                  }
                });
              } else {
                return res.status(400).json({error: ['invalid_grant']});
              }
            } else {
              return res.status(400).json({error: ['invalid_grant']});
            }
          })
          .catch((err) => {
            return res.status(400).json({error: ['invalid_grant']});
          });
    } else {
    }
  });
};

module.exports.logout = (req, res) => {
  return res.status(200).json({auth: false, token: null});
};

// check if user is authenticated
module.exports.isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({errors: ['Not authenticated']});
  } else {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({errors: ['Not authenticated']});
      } else {
        req.user = decoded;
        return next();
      }
    });
  }
};
module.exports.areFriends = (req, res, next) => {
  const userid = req.user.userId;
  const participantIds = req.body.participantIds;
  console.log(userid, participantIds);
  db.UserModel.findOne({id: userid}).populate('friends').exec((err, user) => {
    if (user) {
      console.log(user.friends[0].id);
      for (let friend of user.friends) {
        for (let part of participantIds) {
          if (friend.id === part) {
            return next();
          }
        }
      }
      return res.status(403).json(
          {message: 'You have to be a friend of the contact to send messages'});
    } else {
      return res.status(500).json({message: 'Server error'});
    }
  });
};