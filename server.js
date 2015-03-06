var express = require('express');
var app = express();


app.use("/node_modules", express.static(__dirname+"/node_modules"));
app.use("/dist", express.static(__dirname+"/dist"));
app.use("/build", express.static(__dirname+"/build"));
app.use(express.static(__dirname + "/demo" ));



app.listen(process.env.PORT || 3001);
console.log('Server online.')