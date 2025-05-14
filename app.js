const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const orderRouter = require('./routes/order');
require('dotenv').config();
const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));

app.use('/', orderRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> {
    console.log(`Server running on port ${PORT}`)
})