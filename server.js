const dotenv = require('dotenv')
const path = require('path');
const bodyParser = require("body-parser")
const express = require('express');
const bird_router = require('./routers/bird_router');
const image_router = require('./routers/image_router');
/* load .env */
dotenv.config();

/* Connecting to a database */
const mongoose = require("mongoose");
// const Bird = require("./models/bird");
const user = process.env.ATLAS_USER
const password = process.env.ATLAS_PASSWORD;
const dbName = "assignment2";
const dbUrl = `mongodb+srv://${user}:${password}@birds.ec79wsv.mongodb.net/${dbName}?retryWrites=true&w=majority`;

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}

mongoose.connect(dbUrl, options).then(() => {
    console.log('Successfully connected to db!')
}).catch((e) => {
    console.error(e, 'Could not connect not db!')
});

/* setup Express middleware */
/* create Express app */
const app = express();

// Pug for SSR (static site rendering)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware for POSTs
app.use(bodyParser.urlencoded({encoded: false}))

/* host static resources (.css, .js, ...) */
app.use('/images/', image_router);
app.use('/', express.static(path.resolve(__dirname, 'public/')));

/* redirect root route `/` to `/birds/` */
app.get('/', (req, res) => {
    res.redirect('/birds/');
});

app.use('/birds/', bird_router);

/* 404 Page*/
app.get("*", (req, res) => {
    res.render('404')
})

/* start the server */
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is live http://localhost:${PORT}`);
});

