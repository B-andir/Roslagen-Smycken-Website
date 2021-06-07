const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const async = require('async');
const _ = require('lodash');
const { v4 : uuidv4 } = require('uuid');

const userModel = require('../models/user');
const { localsName } = require('ejs');

mongoose.connect(process.env.DBUSERS_CONN, {useNewUrlParse: true, useUnifiedTopology: true});

const saltRounds = 12;

function GenerateLoginCookie(user) {
    user.loginCookie = uuidv4();
    user.save();

    var token = jwt.sign({ username: user.username, privateKey: user.loginCookie, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
    
    return(token);
}

// Register POST request
router.post('/register', (req, res) => {
    const username = req.body.username;
    const rawPassword = req.body.password;

    userModel.findOne({ username: username }, (err, user) => {
        if (user != null) {
            res.redirect('../register?error=usernameTaken');
        }

        bcrypt.hash(rawPassword, saltRounds, (err, hash) => {
    
            userModel.create({ username: username, password: hash }, (err, user) => {
                if (err) throw err;
                
                console.log("Registered a new user");
    
                res
                    .cookie('LOGIN_TOKEN', GenerateLoginCookie(user), { maxAge: 172800000, httpOnly: false })  // maxAge = 2 days
                    .redirect('../');
            })
        });
    });
});

// Login POST request
router.post('/login', (req, res) => {
    const username = req.body.username;
    const rawPassword = req.body.password;

    userModel.findOne({ username: username }, (err, user) => {
        if (err) console.log(err);

        else if (user != null) {
            bcrypt.compare(rawPassword, user.password, (err, result) => {
                if (err) console.error(err);
        
                if (!result){
                    res.redirect('../login?error=invalidPassword');

                } else {

                    console.log("User logged in");

                    res
                        .cookie('LOGIN_TOKEN', GenerateLoginCookie(user), { maxAge: 172800000, httpOnly: false})  // maxAge = 2 days
                        .redirect('../');
                }
            });
        } else {
            res.redirect('../login?error=invalidUsername');
        }
    });
});

router.post('/logout', (req, res) => {
    const cookie = req.cookies.LOGIN_TOKEN;
    res
        .cookie('LOGIN_TOKEN', null, { maxAge: 0 })
        .redirect('../');
});

module.exports = router;