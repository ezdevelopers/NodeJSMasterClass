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

helpers.createRandomString = function(strLength){
   var  strLength = typeof(strLength) === "number" && strLength > 0 ? strLength : false;

    if(strLength){
        //Define all the possible characters that could go into the string
        var possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";

        //var final str
        var str = "";

        for(var i = 1; i <= strLength; i++){
            var randomChar = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            //Append the character to the string
            str+=randomChar;
        }
        //Return the final string
        return str;
    }else{
        return false
    }
};


//Export helper funcion
module.exports = helpers;