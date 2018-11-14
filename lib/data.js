/*
* Library for storing and editing data
*/

//Dependencies

var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

//Container for module to be exported
var lib = {};

//Base directory for the data folder
lib.baseDir = path.join(__dirname,'/../.data/');

//write data to file
lib.create = function(dir,file,data,callback){
    fs.open(lib.baseDir + dir + '/' + file + ".json","wx", function(err,fileDescriptor){
        if(!err && fileDescriptor){
            //Convert data to string
            var stringData = JSON.stringify(data);

            //write data to file
            fs.writeFile(fileDescriptor,stringData, function(err){
                if(!err){
                    fs.close(fileDescriptor, function(err){
                        if(!err){
                            callback(false);
                        }else{
                            callback({"Error":"Error closing file"});
                        }
                    });
                }else{
                    callback({"Error":"Error writing to file"});
                }
            });
        }else{
            callback({"Error":"Could not create file, it may already exist"});
        }
    });
}

//reading data a file
lib.read = function(dir,file,callback){
    fs.readFile(lib.baseDir + dir + '/' + file +'.json',"utf-8",function(err,data){
        if(!err && data){
            var parsedData = helpers.parseJsonToObject(data);
            callback(false,parsedData);
        }else{
            callback(err,data);
        }
    });

}

//updating data in a file

lib.update = function(dir,file,data,callback){
    //open the file
    fs.open(lib.baseDir + dir + "/" + file +".json", "r+", function(err, fileDescriptor){
        if(!err && fileDescriptor){
            //Convert data to string
            var stringData = JSON.stringify(data);

            //trucate the file
            fs.truncate(fileDescriptor, function(err){
                if(!err){
                    fs.writeFile(fileDescriptor,stringData, function(err){
                        if(!err){
                            fs.close(fileDescriptor, function(err){
                                if(!err){
                                    callback(false);
                                }else{
                                    callback({"Error":"There was an error exiting the file"});
                                }
                            });
                        }else{
                            callback({"Error":"There was an error writing to the file"});
                        }
                    });
                }else{
                    callback({"Error":"There was an error truncating the file"});
                }
            })
        }else{
            callback({"Error":"There was an error opening the file, check if it exist"});
        }
    });
}

//deleting data in a file

lib.delete = function(dir, file, callback){
    fs.unlink(lib.baseDir + dir + "/" + file + ".json",function(err){
        if(!err){
            callback(false);
        }else{
            callback({"Error":"There was an error deleting the file"});
        }
    });
}
//export module
module.exports = lib;