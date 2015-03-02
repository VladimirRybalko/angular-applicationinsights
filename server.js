var express = require('express');
var app = express();


app.use("/node_modules", express.static(__dirname+"/node_modules"));
app.use("/dist", express.static(__dirname+"/dist"));
app.use("/src", express.static(__dirname+"/src"));
app.use(express.static(__dirname + "/demo" ));



app.listen(process.env.PORT || 3001);
console.log('Server online.')