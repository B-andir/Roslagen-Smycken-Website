const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const { v4 : uuidv4 } = require('uuid');

const userModel = require('../models/user')

mongoose.connect(process.env.DBUSERS_CONN, {useNewUrlParse: true, useUnifiedTopology: true});

function GenerateLoginCookie(user) {
    user.loginCookie = uuidv4();
    user.save();
    console.log("Created private login token")

    var token = jwt.sign({ username: user.username, privateKey: user.loginCookie, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
    
    return(token);
}

// Register POST request
router.post('/register', (req, res) => {
    const username = req.body.username;
    const rawPassword = req.body.password;

    try {
        var user = userModel.findOne({ username: username })

        if (user != null) {
            res.render('register', { usernameTaken: true });
        }
    } catch {
        bcrypt.hash(rawPassword, saltRounds, function(err, hash) {

            userModel.create({ username: username, password: hash }, function(err, user) {
                if (err) throw err;

            })
        });
    }
    
    console.log("Registered a new user");

    res
        .cookie('RoslagenSmyckenLoginCookie', GenerateLoginCookie(user), { maxAge: 172800000, httpOnly: false })  // maxAge = 2 days
        .redirect('/');

});

// Login POST request
router.post('/login', (req, res) => {
    const username = req.body.username;
    const rawPassword = req.body.password;


    userModel.findOne({ username: username }, function(err, user) {
        if (err) console.log(err);
        

        if (user != null) {
            bcrypt.compare(rawPassword, user.password, function(err, result) {
                if (err) console.error(err);
        
                if (!result){
                    res.render('login', { title: 'Login', wrongUsername: false, wrongPassword: true });
                }
                else {

                    console.log("User logged in");

                    res
                        .cookie('RoslagenSmyckenLoginCookie', GenerateLoginCookie(user), { maxAge: 172800000, httpOnly: false})  // maxAge = 2 days
                        .redirect('../');
                
                }
            });
        } else {
            res.render('login', { title: 'Login', wrongUsername: true, wrongPassword: false });
        }
    });
});

module.exports = router;