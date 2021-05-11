const express = require('express');
const morgan = require('morgan');

// express app
const app = express();

// register view engine
app.set('view engine', 'ejs');

//const URI = process.env.MONGODB_URI || 'mongodb uri'
const PORT = process.env.PORT || 5000;


// static files accessor
app.use(express.static('public'))

// console logger
app.use(morgan('dev'));


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

app.get('/order', (req, res) => {
    res.render('order', { title: 'Order' });
});

// 404 page
app.use((req, res) => {
    res.status(404).render('404');
});


// run webserver
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`)
});