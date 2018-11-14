/*
* Library for  helper function
*/

//Dependencies
var crypto = require('crypto');
var config = require('./config');


//Container for helper function
var helpers = {}

//hashing helper function
helpers.hash = function(str){
    if(typeof(str) === "string" && str.length > 0){
        var hashedString = crypto.createHmac("sha256",config.hashKey).update(str).digest('hex');
        return hashedString;
    }else{
        return false;
    }
}

helpers.parseJsonToObject = function(str){
    try{
        var obj = JSON.parse(str);
        return obj;

    }catch(e){
        return {};
    }
}


//Export helper funcion
module.exports = helpers;