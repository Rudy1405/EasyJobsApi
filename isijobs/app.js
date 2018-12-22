const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // put de app on any avaliable port in that momento or the 3000
const mongoose = require('mongoose'); 
const User = require("./api/models/user") /// importamos nuestro schema 
const bodyParser = require('body-parser');
const logger = require('morgan')
const boom = require('boom')

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/easyjobsapi", { useMongoClient: true }); 

app.use(bodyParser.urlencoded({extended:true}))
//app.use(bodyParser.json())1405
app.use(bodyParser.json({ 'type': '*/*',limit: '20mb' }));
app.use(logger('dev'))

let routes = require("./api/routes/index")
routes(app); // como ese obj tiene codigo node lo usamos como la app para registrar lasrutas

app.use((err,req,res,next)=>{ /// err handler
    console.error(err.stack)
    res.status(err.statusCode).send({
        error: err.message
    })
})

// put the server running
app.listen(port, () => {
    console.log("Ready at port: " + port);
});

