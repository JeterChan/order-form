const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const orderRouter = require('./routes/order');

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));

app.use('/', orderRouter);

app.listen(3000, ()=> {
    console.log('Server running on http://localhost:3000')
})