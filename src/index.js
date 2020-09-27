const express = require('express');
const xmlReader = require('xml-reader');
const axios = require('axios').default;
const fileUpload = require('express-fileupload');
const app = express();

// Starts up the server
app.listen(process.env.PORT || 2000, (port) => {
    console.log("Server started");
});

app.use(fileUpload({ createParentPath: true }));

// For hosting static resources and pages
app.use(express.static('public'));


app.post('/upload', require("./controller/upload"));