
var bcrypt;
try { bcrypt = require('bcrypt'); }
catch(e) { bcrypt = require('bcryptjs'); }

var password = "admin";
//var vpassword = "$2a$08$JzD6IZRg8wOl/r5qvbyB.uTA2OeL3XnnBjh2RcCdORTVT5GkMYZnC";
var vpassword = "$2a$08$a4HvE/.xZS2Bb8HtFR/EseWRI.anyWRPGHtxj5JnMObDVXjU5TP9C";
bcrypt.compare(password, vpassword, function(err, res) {
                    console.info(" <<< res >>> ", res);
                });