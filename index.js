/*
* Primary file for the API
*
*/
//Dependencies

var http = require('http');
var https = require('https');
var httpsCertificate = require('./https');
var url = require('url');
var fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require("./config");

//create the https server
var httpServer = http.createServer(function(req,res){
    unifiedServer(req, res);
});

//Start the http server
httpServer.listen(config.httpPort, function(){
    console.log(`Listening on port ${config.httpPort} on the ${config.envName} server`);
});

// var httpsCertificate =   {
//     'key': fs.readFileSync('./https/key.pem'),
//     'cert':fs.readFileSync('./https/cert.pem')
// }
//create the https server
var httpsServer = https.createServer(httpsCertificate, function(req, res){
    unifiedServer(req, res);
})
//start the htps server
httpsServer.listen(config.httpsPort,function(){
    console.log(`Listening on port ${config.httpsPort} on the ${config.envName} server`);
});
//create a unified function to handle both http and https connections
var unifiedServer = function(req,res){
    //get the URL and parse it
    var parsedUrl = url.parse(req.url, true);
    //get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,"");

    //get the query string
    var queryStringObject = parsedUrl.query;

    //get the header
    var headers = req.headers;

    //get the HTTP method
    var method = req.method.toLowerCase();

    //parse the payload
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on("data", function(data){
        buffer += decoder.write(data);
    });

    req.on("end", function(){
        buffer += decoder.end();

        //choose handler by routing or return notFound handler
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath]:handler.notfound

        //construct the data to pass to the handler
        var data = {
            'trimmedPath':trimmedPath,
            'queryStringObject':queryStringObject,
            'method':method,
            'headers':headers,
            'payload':buffer
        }

        chosenHandler(data, function(statusCode, payload){
            //use the ststus code called by by the handler or default to 200
            statusCode = typeof(statusCode) === "number" ? statusCode : 200;
            //use the payload called back by the handeler or default to an empty object
            payload = typeof(payload) === "object" ? payload : {};

            //convert payload to string
            var payloadString = JSON.stringify(payload);

            //return the response
            res.setHeader("Content-Type","application/json");
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log("Return the following response",statusCode,payloadString);
        })

        // //log the payload
        // console.log("Request has the folowing payload",buffer);

        // //send a response
        // res.end("Hello World \n");

        // //log out request
        // console.log("Request has the folowing headers ",headers);
        // console.log("Request is received on this path: "+ trimmedPath + " with the method "+ method +" with the following query ",queryStringObject);
    });

}


//define the handlers
handler = {}

//define sample handler
handler.hello = function(data, callback){
    //callback a http status code and the payload object
    callback(200,{'Welcome':'Hello and welcome to our API. Explore all our endpoints'});
}

//define handler notfound
handler.notfound = function(data, callback){
    callback(404);
}

//create the router
var router = {
    'hello':handler.hello
}