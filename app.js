const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const orderRouter = require('./routes/order');
require('dotenv').config();
const app = express();

// 處理 JSON 請求主體
app.use(express.json());

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));

app.use('/', orderRouter);
app.use((req, res) => {
  res.status(404).render('404');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> {
    console.log(`Server running on port ${PORT}`)
})