//facebookStrat.js

function facebookStrat(User, passport, configAuth) {//1
    var FacebookStrategy = require('passport-facebook').Strategy;

    // FACEBOOK STRATEGY
    passport.use(new FacebookStrategy({//2(   //3(   //4{

        // pull in our app id and secret from our auth.js file
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        callbackURL: configAuth.facebookAuth.callbackURL,
        passReqToCallback: true //allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },//4}closed

    // facebook will send back the token and profile
    function(req, token, refreshToken, profile, done) {//5{
        console.log(profile);
        // asynchronous
        process.nextTick(function() {//6(   //7{

            //check if the user is already logged in
            if (!req.user) {//8{

                //find the user in the database based on their facebook id
                User.findOne({'facebook.id': profile.id}, function(err, user) {//8.5(   9{

                    //if there is an error, stop everything and return
                    if (err)
                        return done(err);

                    //if the user is found, then log them in
                    if (user) {//10{

                        //if there is a user id already but no token (user was linked at one point and then removed)
                        //just add our token and profile information
                        if (!user.facebook.token) {
                            user.facebook.token = token;
                            user.facebook.displayName = profile.displayName;
                            
                            user.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }
                        return done(null, user); //user found, return that user
                        
                    } else {
                        //if there is no user found with that facebook id, create that user
                        var newUser = new User();

                        //set all of the facebook information in our user model
                        newUser.facebook.id = profile.id;
                        newUser.facebook.token = token;
                        newUser.facebook.displayName = profile.displayName;

                        //save our user to the database
                        newUser.save(function(err) {//11(   //12{
                            if (err)
                                throw err;

                            //if successful, return the new user
                            return done(null, newUser);
                        });//12}closed   11)closed
                    }//9}closed
                });//8.5)closed
            } else {//8}closed    13{
                // user already exists and is logged in, we have to link accounts
                var user = req.user; //pull the user out of the session

                //update the current users facebook credentials
                user.facebook.id = profile.id;
                user.facebook.token = token;
                user.facebook.displayName = profile.displayName;

                //save the user
                user.save(function(err) {//14(    15{
                    if (err)
                        throw err;
                    return done(null, user);
                });//15 closed 14 closed
            }//13 closed
        });//7 closed 6 closed
    }));//5 closed //3 closed //2closed
};//1 closed

module.exports = facebookStrat;