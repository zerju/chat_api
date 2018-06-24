'use strict';

const express = require('express');
const router = express.Router();
const authController = require(__base + 'app/controllers/auth');
const usersController = require(__base + 'app/controllers/users');
const conversationController =
    require(__base + 'app/controllers/conversations');

router.route('/auth/login').post(authController.login);
router.route('/auth/register').post(authController.register);
router.route('/auth/refreshtoken').post(authController.newAccessToken);
router.route('/users').get(
    authController.isAuthenticated, usersController.getAllUsers);
router.route('/users/sendrequest')
    .post(authController.isAuthenticated, usersController.sendContactRequest);
router.route('/users/add')
    .post(authController.isAuthenticated, usersController.addContact);
router.route('/users/contacts')
    .get(authController.isAuthenticated, usersController.getContacts);
router.route('/user').get(
    authController.isAuthenticated, usersController.getUser);
router.route('/getMessages')
    .post(
        authController.isAuthenticated, authController.areFriends,
        conversationController.getMessages);
router.route('/conversations')
    .get(
        authController.isAuthenticated,
        conversationController.getConversations);
router.route('/conversation-by-contact')
    .post(
        authController.isAuthenticated, authController.areFriends,
        conversationController.createConversation);
router.route('/conversation-by-id')
    .post(
        authController.isAuthenticated,
        conversationController.getConversationById);
module.exports = router;