const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

// Starts up the server
app.listen(process.env.PORT || 2000, function onStartUp() 
{
    console.log("Server started")
}
);

app.use( fileUpload({ createParentPath: true }) );

// For hosting static resources and pages
app.use( express.static('public') );

app.post( '/upload', require("./controller/upload") );