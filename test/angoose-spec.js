var ROOT = process.cwd();
var path= require("path")
var http = require("http");
var fs = require("fs");
var express = require("express");
var request = require('request');
var clientfile =  './build/generated-client.js';
var logging = require("log4js");
var logger = logging.getLogger('angoose');
logger.setLevel(logging.levels.TRACE);

require("jasmine-custom-message");
var Actual = jasmine.customMessage.Actual;

console.log("Deleting ", clientfile);
if(fs.exists(clientfile))
    fs.unlinkSync(clientfile);
var configs = {
    modelDir: ROOT+'/models',
    clientFile: clientfile,
    urlPrefix: '/angoose',
    httpPort: 9988
};

require("./server"); //.startServer(configs);
 
var angoose = require("../lib/angoose"); 
var userdata = { 
    firstname:'Gaelyn', 
    lastname:'Hurd',
    status:'active',
    email:'gaelyn@hurd.com'
};
var clientSource = angoose.generateClient(); //fs.readFileSync( clientfile, 'ascii') ; 
describe("Angoose Server Tests", function(){
    
     it("Load client file from http", function(done){
       request('http://localhost:9988' +configs.urlPrefix+'/angoose-client.js', function(err, response, body){
            eval(body);
            var SampleUser = AngooseClient.getClass("SampleUser");
            var suser = new SampleUser( userdata);
            expect(suser.getFullname()).toBe("Gaelyn Hurd");
            done();
       });
    });
     it("Dependency injection", function(done){
        eval(clientSource);
        var SampleUser = AngooseClient.getClass("SampleUser");
        var suser = new SampleUser( userdata);
        suser.setPassword('abc').done(function(res){
            console.log("setpassword done", arguments);
            expect(suser.password).toBe("abcsalt123");
            expect(res).toBe("Password changed");
            done();
        });
    }); 
     it("Static method", function(done){
        eval(clientSource);
        var SampleUser = AngooseClient.getClass("SampleUser");
        SampleUser.checkExists('newmeil@he.com').done(function(exists){
            console.log("Done done", arguments);
            expect(exists).toBe(false);
            done();
        });
    }); 
    it("Sample Service", function(done){
        eval(clientSource);
        var SampleService = AngooseClient.getClass("SampleService");
        new SampleService().listFavoriteDestinations().done(function(places){
            console.log("Places", places);
            expect(places[0]).toBe("Paris");
            done();
        });
    });
    it("Sample User Groups", function(done){
        eval(clientSource);
        var SampleUser = AngooseClient.getClass("SampleUser");
        var SampleUserGroup = AngooseClient.getClass("SampleUserGroup");
        var group = new SampleUserGroup({
            name:'testgroup'
        });
        group.save(function(err, res){
            //console.log("save group", err, group);
            SampleUserGroup.find({"name":"testgroup"}, function(err, grps){
                 var suser = new SampleUser( userdata);
                 suser.email = new Date().getTime() + suser.email;
                 suser.groupRef = grps[0];
                 suser.save(function(err, res){
                     console.log("Save user", err, res)
                     expect(err).toBeUndefined()
                     suser.remove(function(reError, reRes){
                        console.log("Remove user", reError, reRes)
                        expect(reError).toBeUndefined();
                        done();    
                     })
                     
                 })   
            })
             
        })
    });
     it("Sample User Find", function(done){
        var SSU = require(ROOT+ "/models/SampleUser");
        
        eval(clientSource);
        var SampleUser = AngooseClient.getClass("SampleUser");
        
        expect(SampleUser.save).not.toBeTruthy()
        expect(SampleUser.find).toBeTruthy()
        expect(SampleUser.findOne).toBeTruthy()
        
        var suser = new SampleUser( userdata);
        expect(suser.remove).toBeTruthy()
        suser.save().done(function(res){
                console.log("Expecting save OK: ", res);
                
                SSU.findById( suser._id ).exec(function(err, obj){
                    console.log("server object find",err,  obj);
                    
                    SampleUser.findById( suser._id ).done(function(su){
                        console.log("Expecting findById OK: ", su);
                        done();
                    }, function(err){
                        console.log("Failed to find ", err);
                        expect(err).toBe("OK");
                        done();
                    })
                });
                
                // now trying to find one
                //SampleUser.find()
        })
    });
    it("Sample User Save", function(done){
        eval(clientSource);
        var SampleUser = AngooseClient.getClass("SampleUser");
        
        expect(SampleUser.save).not.toBeTruthy()
        
        var suser = new SampleUser( userdata);
        expect(suser.remove).toBeTruthy()
        suser.email = 'john@'
        suser.save(function(err, res){  // can either user callback for promise
            console.log("Expecting error: ", err, res);
            expect(err).toBeTruthy();
            expect(err.indexOf('email')).toBeGreaterThan(0);
            suser = new SampleUser( userdata);
            suser.save().done(function(res){
                console.log("Expecting save OK: ", res);
                
                SampleUser.find({email:suser.email}).done(function(su){
                    console.log("Expecting find OK: ", su);
                    expect(su && su.length).toBe(1)
                    if(!su || !su.length) return done();
                    var foundUser = su[0];
                    foundUser.email = 'Invalid';
                    foundUser.save(function(err, res){
                        console.log("Expect saving invalid foundUser to fail:", err);
                        expect(err).toBeTruthy();
                        
                        foundUser.remove().done(function(res){
                            console.log("Expecting remove() to be OK:", res);
                            done();
                        }, function(er){
                            console.log("Failed to remove", er);
                            expect(err).toBe("OK");                        
                        });    
                    })
                        
                }, function(err){
                    console.log("Failed to find ", err);
                    expect(err).toBe("OK");
                    done();
                })
                // now trying to find one
                //SampleUser.find()
                
                
            }, function(er){
                console.log("Unexpected error: ", er);
            })
        })
    });
    
    it("Execution Context", function(done){
        console.log("Execution context test");
        eval(clientSource);
        var SampleService = AngooseClient.getClass("SampleService");
        new SampleService().testExecutionContext().done(function(data){
            console.log("Got context path", data)
            expect(new Actual(data), "Execution context expecting /angoose/xxx but got: "+ data).toBeTruthy();
            done();
        }, function(err){
            
        })
    });
});
function startApp(){
    var app = express();
    app.configure(function() {
        app.set('port', configs.httpPort);
        app.use(express.bodyParser());
        /* manage sessions */
        app.use(express.cookieParser());
        app.use(express.session({secret: '1234567890QWERTY'}));
        app.use(app.router);
        app.use(function(err, req, res, next){
            console.log("In error handling", err)
            if (err.message == 'APIAuthError') {
                res.send(401, {success:false, msg:"Authorization Error"});
            } else {
                res.send(500, 'Something broke!');
            };
        });
        app.use(express.methodOverride());
        app.use(express.static(path.join(__dirname, 'public')));
    });
    http.createServer(app).listen( configs.httpPort, function(){
        console.log("Listening on port " ,  configs.httpPort);    
    });
    return app;   
}

exports = {
    clientcode: clientSource
}
