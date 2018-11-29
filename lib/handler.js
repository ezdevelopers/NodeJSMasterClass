/*
* Library for  handling http routes
*/

//Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

//define the handlers
handler = {}

//Users handler
handler.user = function(data, callback){
    //Accepteble methods
    var acceptableMethods = ["get","post","put","delete"];
    if(acceptableMethods.indexOf(data.method) > -1){
        handler._user[data.method](data,callback);
    }else{
        callback(405,{"Error":"Methods are not accepted"});
    }
}

//request method handlers
handler._user = {}

//Get Request handler
//Require @param phone
handler._user.get = function(data, callback){
// get the phone number
var phone = typeof(data.queryStringObject.phone) == "string" &&  data.queryStringObject.phone.length >= 10 ? data.queryStringObject.phone : false

    if(phone){
        var token =  typeof(data.headers.token) === "string" ? data.headers.token : false;
        handler._tokens.verifyToken(token,phone,function(tokenIsValid){
            if(tokenIsValid){
                 //read the user data
                _data.read("users",phone, function(err,data){
                    if(!err && data){
                        //delete the hashed password before data is returned
                        delete data.hashedPassword;
                        callback(200,data)
                    }else{
                        callback(404)
                    }
                 });
            }else{
                callback(403,{"Error":"Missing required field token, or token is invalid"})
            }
        });
        
    }else{
        callback(400,{"Error":"Some required fields are missing"})
    }
}
//Post Request handler
//Required @param phone
handler._user.post = function(data, callback){
    //Check all required fields are filled out
    //Required fields are firstname, lastname, phone, password and tosAgreement
    var firstname = typeof(data.payload.firstname) === "string" && data.payload.firstname.length > 0 ? data.payload.firstname : false;
    var lastname = typeof(data.payload.lastname) === "string" && data.payload.lastname.length > 0 ? data.payload.lastname : false;
    var phone = typeof(data.payload.phone) === "string" && data.payload.phone.length >= 10 ? data.payload.phone : false;
    var password = typeof(data.payload.password) === "string" && data.payload.password.length >= 10 ? data.payload.password : false;
    var tosAgreement = typeof(data.payload.tosAgreement) === "boolean" && data.payload.tosAgreement === true ? true : false;

    if(firstname && lastname && phone && password && tosAgreement){
        //check if user already exists using the phone number
    _data.read("users",phone,function(err, data){
        if(err){
            //hash the password
            var hashedPassword = helpers.hash(password);

            //create the user object 
            if(hashedPassword){
                var userObject  = {
                    "firstname":firstname,
                    "lastname":lastname,
                    "phone":phone,
                    "hashedPassword":hashedPassword,
                    "tosAgreement": true
                }
                _data.create("users",phone,userObject, function(err){
                    if(!err){
                        callback(200,{"Mesaage":"Successfully created user"})
                    }else{
                        callback(500,{"Error":"User could not be created"})
                    }
                });

            }else{
                callback(500,{"Error":"Could not hash the user's password "})
            }
        }else{
            callback(400,{"Error":"A user with the phone number already exists"});
        }
    });

    }else{
        callback(400,{"Error": "Some required fields are missing"})
    }
}
//Put Request handler
//Required @param is phone
//Optional @param is either firstname, lastname, password
handler._user.put = function(data, callback){
    // get the phone number
    var phone = typeof(data.payload.phone) == "string" &&  data.payload.phone.length >= 10 ? data.payload.phone : false
    
    //Check all optional fields are filled out
    var firstname = typeof(data.payload.firstname) === "string" && data.payload.firstname.length > 0 ? data.payload.firstname : false;
    var lastname = typeof(data.payload.lastname) === "string" && data.payload.lastname.length > 0 ? data.payload.lastname : false; 
    var password = typeof(data.payload.password) === "string" && data.payload.password.length >= 10 ? data.payload.password : false;
    
    //check if required parameter is available
    if(phone){
        if(firstname || lastname || password){

            var token =  typeof(data.headers.token) === "string" ? data.headers.token : false;
            handler._tokens.verifyToken(token,phone,function(tokenIsValid){
                if(tokenIsValid){
                     //check is the user exists
            _data.read("users",phone,function(err, userData){
                if(!err){
                    //update the user data
                    if(firstname){
                        userData.firstname = firstname;
                    }
                    if(lastname){
                        userData.lastname = lastname;
                    }
                    if(password){
                        userData.hashedPassword = helpers.hash(password);
                    }
                //store user data i
                _data.update("users",phone,userData, function(err){
                    if(!err){
                        callback(200);
                    }else{
                        callback(500,{"Error":"We could not update your details"})
                    }
                });
                }else{
                    callback(404);
                }
            });
    
                }else{
                    callback(403,{"Error":"Missing/Invalid token in header"})
                }
            });

        }else{
            callback(400,{"Error":"Some required parameters are missing"}); 
        }
    }else{
        callback(400,{"Error":"Some required parameters are missing"});
    }
}
//Delete Request handler
//Required @param is phone
//Optional @param is either firstname, lastname, password
handler._user.delete = function(data,callback){
    // get the phone number
var phone = typeof(data.queryStringObject.phone) == "string" &&  data.queryStringObject.phone.length >= 10 ? data.queryStringObject.phone : false

if(phone){
    var token =  typeof(data.headers.token) === "string" ? data.headers.token : false;
    handler._tokens.verifyToken(token,phone,function(tokenIsValid){
        if(tokenIsValid){
             //read the user data
            _data.read("users",phone, function(err,data){
                if(!err && data){
                    _data.delete("users",phone,function(err){
                        if(!err){
                            //delete all the checks associated with the user
                            var userChecks = typeof(userData.checks) === "object" && userData.checks instanceof Array ? userData.checks : [];
                            var checksToDelete =  userChecks.length;
                            if(checksToDelete > 0){
                                var checksDeleted = 0;
                                var deletionError = false;

                                userChecks.forEach(function(elem){
                                    _data.delete("checks", checkId , function(){
                                        if(!err){
                                            deletionError = true;
                                        }
                                        checksDeleted++;
                                        if(checksDeleted === checksToDelete){
                                            if(!deletionError){
                                                callback(200);
                                            }else{
                                                callback(500,{"Error":"Failed to delete the checks associated with the user"})
                                            }
                                        }
                                    })
                                });
                            }else{
                                callback(200)
                            }
                        }else{
                            callback(500,{"Error":"We could not delete the user"})
                        }
                    });
                }else{
                    callback(400,{"Error":"Could not find the selected user"})
                }
            });
           
        }else{
            callback(403,{"Error":"Missing/Invalid token in header"})
        }
    });
    
    }else{
        callback(400,{"Error":"Some required fields are missing"})
    }

}

//Token handler
handler.tokens = function(data, callback){
    //Accepteble methods
    var acceptableMethods = ["get","post","put","delete"];
    if(acceptableMethods.indexOf(data.method) > -1){
        handler._tokens[data.method](data,callback);
    }else{
        callback(405,{"Error":"Methods are not accepted"});
    }
}

//token request
handler._tokens = {}

//Token post
//Required data phone number,password
//Optional data none
handler._tokens.post = function(data, callback){
    var phone = typeof(data.payload.phone) === "string" && data.payload.phone.length >= 10 ? data.payload.phone : false;
    var password = typeof(data.payload.password) === "string" && data.payload.password.length >= 10 ? data.payload.password : false;
    
    if(phone && password){
        _data.read("users",phone,function(err,userData){
            if(!err){
                //hash the password
                var hashedPassword = helpers.hash(password);
                if(hashedPassword === userData.hashedPassword){
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 *60 * 60;
                    var tokenObject = {
                        "id":tokenId,
                        "expires":expires,
                        "phone":phone
                    };
                    _data.create("tokens",tokenId,tokenObject, function(err){
                        if(!err){
                            callback(200,tokenObject);
                        }else{
                           callback(500,{"Error":"We could not create the token"}) 
                        }
                    });
                }else{
                    callback(400, {"Error":"We could not find a match for user with that password"})
                }

            }else{
                callback(400,{"Error":"Could not find the specified user"});
            }
        });
    }else{
        callback(400, {"Error":"Missing required fields"});
    }
}

//get token
//Required data Id
//Optional data none

handler._tokens.get = function(data,callback){
    // get the id
    var id = typeof(data.queryStringObject.id) === "string" &&  data.queryStringObject.id.length === 20 ? data.queryStringObject.id : false

    if(id){
        //read the user data
        _data.read("tokens",id, function(err,tokenData){
            if(!err && tokenData){
                callback(200,tokenData);
            }else{
                callback(404);
            }
        });
        
    }else{
        callback(400,{"Error":"Some required fields are missing"})
    }
}

//put token
//Required data extend
//Optional data none

handler._tokens.put = function(data, callback){
    var id = typeof(data.payload.id) === "string" && data.payload.id.length >= 20 ? data.payload.id : false;
    var extend = typeof(data.payload.extend) === "boolean" && data.payload.extend === true ? true : false;

    if(id && extend){
        _data.read("tokens",id,function(err, tokenData){
            if(!err && tokenData){
                tokenData.expires = Date.now() + 1000 *60*60;
                //Save the new token data
                _data.update("tokens",id,tokenData, function(err){
                    if(!err){
                        callback(200);
                    }else{
                        callback(500,{"Error":"We could not update the token"});
                    }
                });

            }else{
                callback(404, {"Error":"We could not find the specified token"});
            }
        })

    }else{
        callback(400,{"Error":"Some required fields are missing"})
    }

}

//delete token
//Required data id
//Optional data none

handler._tokens.delete = function(data, callback){
    var id = typeof(data.payload.id) === "string" && data.payload.id.length >= 20 ? data.payload.id : false;
    if(id){
        _data.read("tokens", id, function(err, tokenData){
            if(!err && tokenData){
                _data.delete("tokens",id, function(err){
                    if(!err){
                        callback(200);
                    }else{
                        callback(500,{"Error":"We could not delete the token"})
                    }
                });
            }else{
                callback(404,{"Error":"We could not find the token"})
            }
        });
    }else{
        callback(400,{"Error":"Some required fields are missing"})
    }
    
    
}

//verify if a given token id is valid for the current user
handler._tokens.verifyToken = function(id,phone,callback){
    _data.read("tokens",id,function(err, tokenData){
        if(!err && tokenData){
            if(tokenData.phone === phone && tokenData.expires > Date.now()){
                callback(true);
            }else{
                callback(false)
            }
        }else{
            callback(false)
        }
    });
}


//Checks handler
handler.checks = function(data, callback){
    //Accepteble methods
    var acceptableMethods = ["get","post","put","delete"];
    if(acceptableMethods.indexOf(data.method) > -1){
        handler._checks[data.method](data,callback);
    }else{
        callback(405,{"Error":"Methods are not accepted"});
    }
}

//checks container for all the methods
handler._checks = {};

//get checks
//Required data: checkId
//Optional Data: none
handler._checks.get = function(data, callback){
    // get the phone number
    var checkId = typeof(data.queryStringObject.id) == "string" &&  data.queryStringObject.id.length == 20 ? data.queryStringObject.id : false;

    if(checkId){
        //read the checks and return the user phone associated with the check
        _data.read("checks", checkId, function(err,checkData){
            if(!err && checkData){
                var phone = checkData.userPhone;
                //get the token from the header 
                var token = typeof(data.headers.token) == "string" ? data.headers.token : false;
                //veridy if the token id valid
                handler._tokens.verifyToken(token,phone, function(istokenValid){
                    if(istokenValid){
                        callback(200,checkData);
                    }else{
                        callback(403,{"Error":"Missing/Invalid token"});
                    }
                });
            }else{
                callback(404)
            }
        });
    }else{
        callback(403,{"Error":"Missing required fields"})
    }

}

//post checks
//Required data: url, protocol, method, successCodes, timeoutSeconds
//Optional Data: none 
handler._checks.post = function(data, callback){
    //protocol paylaod
    var protocol = typeof(data.payload.protocol) === "string" && ['http','https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    //url paylaod
    var url = typeof(data.payload.url) === "string" && data.payload.url.trim().length > 0 ? data.payload.url : false;
    //method paylaod
    var method = typeof(data.payload.method) === "string" && ['get','post','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method: false;
    //successCodes paylaod
    var successCodes = typeof(data.payload.successCodes) === "object" && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes: false;
    //timeoutSeconds paylaod
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) === "number" && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if(protocol && url && method && successCodes && timeoutSeconds){
        // get the token from the header
       var token =  typeof(data.headers.token) === "string" ? data.headers.token : false;
                //get the tokens data
                _data.read("tokens",token,function(err, tokenData){
                    if(!err && tokenData){
                        var phone = tokenData.phone;
                        //get the users data
                        _data.read("users",phone, function(err, userData){
                            if(!err && userData){
                                var userChecks = typeof(userData.checks) === "object" && userData.checks instanceof Array ? userData.checks : [];

                                if(userChecks.length < config.maxChecks){
                                    var checkId =  helpers.createRandomString(20);
                                    var checkObject = {
                                        "id": checkId,
                                        "userPhone":phone,
                                        "protocol":protocol,
                                        "url":url,
                                        "method":method,
                                        "successCodes":successCodes,
                                        "timeoutSeconds":timeoutSeconds
                                    }

                                    //store the data

                                _data.create("checks",checkId,checkObject,function(err){
                                    if(!err){
                                        //add the checkid to users data
                                        userData.checks = userChecks;
                                        userData.checks.push(checkId);

                                        //save the user object
                                        _data.update("users",phone,userData, function(err){
                                            if(!err){
                                                callback(200,checkObject);
                                            }else{
                                                callback(500,{"Error":"Could not store user check"})
                                            }
                                        });
                                    }else{
                                      callback(500,{"Error":"Could not create the new check"})  
                                    }
                                })

                                }else{
                                    callback(403,{"Error":"User has reached his maximum checks of ('"+config.maxChecks+"')"});
                                }

                            }else{
                                callback(403,{"Error":"There is no user associated with that token"})
                            }
                        })
                    }else{
                        callback(403,{"Error":"Token does not exist"})
                    }

                });
    }else{
        callback(403, {"Error":"Missing fields required"});
    }
}

//update checks 
//Required data: id 
//Optional Data: url, protocol, method, successCodes, timeoutSeconds
handler._checks.put = function(data, callback){
     // get the check id
     var checkId = typeof(data.payload.id) == "string" &&  data.payload.id.length == 20 ? data.payload.id : false;
    
     //Check all optional fields are filled out
     var protocol = typeof(data.payload.protocol) === "string" && ['http','https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
     //url paylaod
     var url = typeof(data.payload.url) === "string" && data.payload.url.trim().length > 0 ? data.payload.url : false;
     //method paylaod
     var method = typeof(data.payload.method) === "string" && ['get','post','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method: false;
     //successCodes paylaod
     var successCodes = typeof(data.payload.successCodes) === "object" && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes: false;
     //timeoutSeconds paylaod
     var timeoutSeconds = typeof(data.payload.timeoutSeconds) === "number" && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
     
     
     //check if required parameter is available
     if(checkId){
         if(protocol || url || method ||successCodes || timeoutSeconds){
             //check is the user exists
             _data.read("checks",checkId,function(err, checkData){
                if(!err){
                    var phone = checkData.userPhone;
                    var token =  typeof(data.headers.token) === "string" ? data.headers.token : false;
                    handler._tokens.verifyToken(token,phone,function(tokenIsValid){
                        if(tokenIsValid){
                              //update the check data
                                if(protocol){
                                    checkData.protocol = protocol;
                                }
                                if(url){
                                    checkData.url = url;
                                }
                                if(method){
                                    checkData.method = method;
                                }
                                if(successCodes){
                                    checkData.successCodes = successCodes;
                                }
                                if(timeoutSeconds){
                                    checkData.timeoutSeconds = timeoutSeconds;
                                }
                            //store check data 
                            _data.update("checks",checkId,checkData, function(err){
                                if(!err){
                                    callback(200);
                                }else{
                                    callback(500,{"Error":"We could not update your check details"})
                                }
                            });
                        }else{
                            callback(403,{"Error":"Missing/Invalid token in header"})
                        }
                    });
                }else{
                    callback(404);
                }
            });
 
         }else{
             callback(400,{"Error":"Some required parameters are missing"}); 
         }
     }else{
         callback(400,{"Error":"Some required parameters are missing"});
     }

}

//delete checks 
handler._checks.delete = function(data, callback){
// get the phone number
var checkId = typeof(data.queryStringObject.id) == "string" &&  data.queryStringObject.id.length == 20 ? data.queryStringObject.id : false

if(checkId){
    _data.read("checks",checkId, function(err,checkData){
        if(!err && checkData){
            var token =  typeof(data.headers.token) === "string" ? data.headers.token : false;
            handler._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
                if(tokenIsValid){
                    //read the user data
                    _data.read("users",checkData.userPhone, function(err,userData){
                        if(!err && userData){
                            //delete the data for the selected checks in the checks data
                           _data.delete("checks",checkId,function(){
                                if(!err){
                                    var userChecks = typeof(userData.checks) === "object" && userData.checks instanceof Array ? userData.checks : [];
                                    //we need to delete the check Id on the selected user data
                                    var checkIndex =  userChecks.indexOf(checkId);
                                    if(checkIndex > -1 ){
                                        userChecks.splice(checkIndex,1);
                                        //save the data to the users
                                        _data.update("users",checkData.userPhone,userData, function(err){
                                            if(!err){
                                                callback(200);
                                            }else{
                                                callback(500,{"Error":"We could not update the user"});
                                            }
                                        });
                                    }else{
                                        callback(500,{"Error":"Could not delete the selected check on the user"})
                                    }
                                }else{
                                    callback(400,{"Error":"Could not find the selected user, so could not delete checks"});
                                }
                           });
                        }else{
                            callback(400,{"Error":"Could not find the selected user, so could not delete checks"});
                        }
                    });
                
                }else{
                    callback(403,{"Error":"Missing/Invalid token in header"})
                }
            });

        }else{
            callback(404,{"Error":"Id does not exist"});
        }
    });
    
    
    }else{
        callback(400,{"Error":"Some required fields are missing"})
    }
}
//define sample handler
handler.hello = function(data, callback){
    //callback a http status code and the payload object
    callback(200,{'Welcome':'Hello and welcome to our API. Explore all our endpoints'});
}

//define handler notfound
handler.notfound = function(data, callback){
    callback(404);
}

module.exports = handler;