const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv').config();
const bcrypt = require('bcryptjs');
const createDOMPurify = require('dompurify');
const { Console } = require('console');
const { JSDOM } = require('jsdom');
const { v4 : uuidv4 } = require('uuid');

const windowEmulator = new JSDOM('').window;
const DOMPurify = createDOMPurify(windowEmulator);

const userModel = require('./models/user');

const JWT_SECRET = process.env.JWT_SECRET;
const DBUSERS_CONN = process.env.DBUSERS_CONN;
const PORT = process.env.PORT != null ? process.env.PORT : 5000;
const saltRounds = 12;

if (DOMPurify.isSupported){
    console.log("DOMPurify is supported!");
}

// Used to authenticate login cookies
process.env.LOGIN_COOKIE = uuidv4();

// express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false
}));

// connect to mongodb
mongoose.connect(DBUSERS_CONN, {useNewUrlParse: true, useUnifiedTopology: true});

const dbUsers = mongoose.connections[0];
dbUsers.on('error', console.error.bind(console, 'connection error:'));
dbUsers.once('open', function() {
    // Something goes here
});

// register view engine
app.set('view engine', 'ejs');

// static files accessor
app.use(express.static('public'))

// console logger
app.use(morgan('dev'));

app.use('/', require('./middleware/checkCookie.js'));

app.use('/account', require('./routes/login.js'));
app.use('/', require('./routes/routing.js'));

// run webserver
app.listen(PORT, () => {
    console.log(`\nServer running on port ${PORT}...\n`)
});