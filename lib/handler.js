/*
* Library for  handling http routes
*/

//Dependencies
var _data = require('./data');
var helpers = require('./helpers')

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
//@TODO check if user is authenticated and only return users data
handler._user.get = function(data, callback){
// get the phone number
var phone = typeof(data.queryStringObject.phone) == "string" &&  data.queryStringObject.phone.length >= 10 ? data.queryStringObject.phone : false

    if(phone){
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
//@TODO check if user is authenticated and user can only update his data
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
            callback(400,{"Error":"Some required parameters are missing"}); 
        }
    }else{
        callback(400,{"Error":"Some required parameters are missing"});
    }
}
//Delete Request handler
//Required @param is phone
//Optional @param is either firstname, lastname, password
//@TODO check if user is authenticated and user can only delete his data
//@TODO delete all data associated with the user
handler._user.delete = function(data,callback){
    // get the phone number
var phone = typeof(data.queryStringObject.phone) == "string" &&  data.queryStringObject.phone.length >= 10 ? data.queryStringObject.phone : false

if(phone){
    //read the user data
    _data.read("users",phone, function(err,data){
        if(!err && data){
            _data.delete("users",phone,function(err){
                if(!err){
                    callback(200);
                }else{
                    callback(500,{"Error":"We could not delete the user"})
                }
            });
        }else{
            callback(400,{"Error":"Could not find the selected user"})
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