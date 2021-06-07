const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const async = require('async');
const _ = require('lodash');

const userModel = require('../models/user')

mongoose.connect(process.env.DBUSERS_CONN, {useNewUrlParse: true, useUnifiedTopology: true});


router.use(async (req, res, next) => {
    const cookie = req.cookies.RoslagenSmyckenLoginCookie;

    res.locals.username =  undefined;

    if (cookie != undefined) {
         await jwt.verify(cookie, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return err;

            userModel.findOne({ username: decoded.username }, async function (err, user) {

                console.log(user.username);
                if (err) {
                    
                    // res.cookie('RoslagenSmyckenLoginCookie', null, { maxAge: 0, httpOnly: false })  // Delete fake cookie

                    return err;
                }

                else if (user.loginCookie === decoded.privateKey){

                    res.locals.username = decoded.username

                    await next();
    
                } else {
    
                    console.warn("An unvalid private login key was attempted to pass for user " + decoded.username);
    
                    // res.cookie('RoslagenSmyckenLoginCookie', null, { maxAge: 0, httpOnly: false })  // Delete fake cookie

                }
            });
        });
    } else {

        next();
        
    }

});

module.exports = router;