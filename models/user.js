const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ username: String, password: String, loginCookie: String, isAdmin: false });

const userModel = mongoose.model('User', userSchema, 'users');

module.exports = userModel;