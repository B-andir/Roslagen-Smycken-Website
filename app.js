const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const dotenv = require('dotenv').config();
const bcrypt = require('bcryptjs');
const createDOMPurify = require('dompurify');
const { Console } = require('console');
const { JSDOM } = require('jsdom');

const windowEmulator = new JSDOM('').window;
const DOMPurify = createDOMPurify(windowEmulator);

const upload = multer({ dest: "uploads/" });

const JWT_SECRET = process.env.JWT_SECRET;
const DBUSERS_CONN = process.env.DBUSERS_CONN;
const PORT = process.env.PORT != null ? process.env.PORT : 5000;
const saltRounds = 12;

if (DOMPurify.isSupported){
    console.log("DOMPurify is supported!");
}

// express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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


// Register POST request
app.post('/api/register', (req, res) => {
    const username = req.body.username;
    const rawPassword = req.body.password;

    bcrypt.hash(rawPassword, saltRounds, function(err, hash) {

        const userModel = mongoose.model('User', new mongoose.Schema({ username: String, password: String }), 'users');
        
        userModel.create({ username: username, password: hash }, function(err, user) {
            if (err) throw err;

        })
    });



    res.redirect('/');
});


// requests for pages

app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'About Us' });
});

app.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact' });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

app.get('/order', (req, res) => {
    res.render('order', { title: 'Order' });
});

app.get('/order/build', (req, res) => {
    console.log(req.query)
    res.render('buildOrderTemplate', { title: 'Build Order Template', kind: req.query.kind });
});


// Build order request
const handleError = (err, res) => {
    res
        .status(500)
        .contentType("text/plain")
        .end("Oops! Something went wrong!");
};

app.post('/order/build/upload', upload.single("image"), (req, res) => {
    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, "./public/images/", req.file.originalname);
    console.log(req.body);

    var pathExtname = path.extname(req.file.originalname).toLowerCase()
    if (pathExtname === ".png" || pathExtname === ".jpg") {
        fs.rename(tempPath, targetPath, err => {
        if (err) return handleError(err, res);

        res
            .status(200)
            .contentType("text/plain")
            .end("File uploaded!");

        });
    } else {
        fs.unlink(tempPath, err => {
        if (err) return handleError(err, res);

        res
            .status(403)
            .contentType("text/plain")
            .end("Only .png and .jpg files are allowed!");

        });
    }
});


// 404 page
app.use((req, res) => {
    res.status(404).render('404');
});

// run webserver
app.listen(PORT, () => {
    console.log(`\nServer running on port ${PORT}...\n`)
});