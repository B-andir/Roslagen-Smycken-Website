const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({ dest: "uploads/" });


// requests for pages

router.get('/', (req, res) => {
    console.log(res.locals)
    res.render('index', { title: 'Home', username: res.locals.username });
});

router.get('/about', (req, res) => {
        res.render('about', { title: 'About Us' });
});

router.get('/contact', (req, res) => {
        res.render('contact', { title: 'Contact' });
});

router.get('/order', (req, res) => {
        res.render('order', { title: 'Order' });
});

router.get('/order/build', (req, res) => {
        res.render('buildOrderTemplate', { title: 'Build Order Template', userInfo, kind: req.query.kind });
});


router.get('/login', (req, res) => {
    console.log(req.url);
    res.render('login', { title: 'Login', wrongUsername: false, wrongPassword: false });
});

router.get('/register', (req, res) => {
    res.render('register', { title: 'Register', error: req.query.error });
});


// Build order request
const handleError = (err, res) => {
    res
        .status(500)
        .contentType("text/plain")
        .end("Oops! Something went wrong!");
};

router.post('/order/build/upload', upload.single("image"), (req, res) => {
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
router.get((req, res) => {
    res.status(404).render('404');
});

module.exports = router;