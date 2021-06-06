const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const multer = require('multer');
const MongoClient = require('mongodb').MongoClient;
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

const upload = multer({ dest: "uploads/" });

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

const userModel = mongoose.model('User', new mongoose.Schema({ username: String, password: String, loginCookie: String, isAdmin: false }), 'users');

async function ReadLoginCookie(cookies, res, _callback) {
    const cookie = cookies.RoslagenSmyckenLoginCookie;

    let response = {
        isLoggedIn: false,
        username: null
    };

    if (cookie === undefined){
        _callback(response);
    } else {
        var decoded = jwt.verify(cookie, JWT_SECRET);

        try {
            userModel.findOne({ username: decoded.username }, function(err, user){
    
                if (user.loginCookie === decoded.privateKey){
    
                    response.isLoggedIn = true;
                    response.username = decoded.username;
    
                    // console.log(response);
    
                    _callback(response);
    
                } else {
    
                    console.warn("An unvalid private login key was attempted to pass for user " + decoded.username);
    
                    res.cookie('RoslagenSmyckenLoginCookie', null, { maxAge: 0, httpOnly: false })  // Delete fake cookie
    
                    _callback(response);
                }
            });
        } catch(err) {
            console.log(err)

            res.cookie('RoslagenSmyckenLoginCookie', null, { maxAge: 0, httpOnly: false })  // Delete fake cookie

            _callback(response);
        }
    }
}

function GenerateLoginCookie(user) {
    user.loginCookie = uuidv4();
    user.save();
    console.log("Created private login token")

    var token = jwt.sign({ username: user.username, privateKey: user.loginCookie, isAdmin: user.isAdmin }, JWT_SECRET);
    
    return(token);
}

// Register POST request
app.post('/api/register', (req, res) => {
    const username = req.body.username;
    const rawPassword = req.body.password;

    try {
        var user = userModel.findOne({ username: username })

        if (user != null) {
            res.redirect('/register?error=usernameTaken');
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
app.post('/api/login', (req, res) => {
    const username = req.body.username;
    const rawPassword = req.body.password;

    userModel.findOne({ username: username }, function(err, user) {
        if (err) return err;

        if (user != null) {
            bcrypt.compare(rawPassword, user.password, function(err, result) {
                if (err) console.error(err);
        
                if (!result){
                    res.redirect('/login?error=wrongPassword')
                }
                else {

                    console.log("User logged in");

                    res
                        .cookie('RoslagenSmyckenLoginCookie', GenerateLoginCookie(user), { maxAge: 172800000, httpOnly: false})  // maxAge = 2 days
                        .redirect('/');
                
                }
            });
        } else {
            res.redirect('/login?error=wrongUsername')
        }
    });

});


// requests for pages

app.get('/', (req, res) => {
    ReadLoginCookie(req.cookies, res, userInfo => {
        console.log(userInfo);
        res.render('index', { title: 'Home', userInfo, error: req.query.error });
    });
});

app.get('/about', (req, res) => {
    ReadLoginCookie(req.cookies, res, userInfo => {
        console.log(userInfo);
        res.render('about', { title: 'About Us', userInfo });
    });
});

app.get('/contact', (req, res) => {
    ReadLoginCookie(req.cookies, res, userInfo => {
        console.log(userInfo);
        res.render('contact', { title: 'Contact', userInfo });
    });
});

app.get('/order', (req, res) => {
    ReadLoginCookie(req.cookies, res, userInfo => {
        console.log(userInfo);
        res.render('order', { title: 'Order', userInfo });
    });
});

app.get('/order/build', (req, res) => {
    ReadLoginCookie(req.cookies, res, userInfo => {
        console.log(userInfo);
        res.render('buildOrderTemplate', { title: 'Build Order Template', userInfo, kind: req.query.kind });
    });
});


app.get('/login', (req, res) => {
    res.render('login', { title: 'Login', error: req.query.error });
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'Register', error: req.query.error });
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