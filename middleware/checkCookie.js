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
    const cookie = req.cookies.LOGIN_TOKEN;

    res.locals.user = {
        username: undefined,
        isAdmin: false
    };

    if (cookie != undefined) {
         await jwt.verify(cookie, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return err;

            userModel.findOne({ username: decoded.username }, async function (err, user) {

                if (err) {
                    
                    res.cookie('LOGIN_TOKEN', null, { maxAge: 0 })  // Delete fake cookie

                    return err;
                }

                else if (user.loginCookie === decoded.privateKey){

                    res.locals.user = {
                        username: decoded.username,
                        isAdmin: decoded.isAdmin
                    };
                        

                    await next();
    
                } else {

                    console.warn("An unvalid private login key was attempted to pass for user " + decoded.username);
    
                    res.cookie('LOGIN_TOKEN', null, { maxAge: 0 })  // Delete fake cookie

                    await next();                    
                }
            });
        });
    } else {

        next();
    }

});

module.exports = router;