//googleStrat.js

function googleStrat(User, passport, configAuth) {
    var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

    // GOOGLE STRATEGY
    passport.use(new GoogleStrategy({

        // pull in our app id and secret from our auth.js file
        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        callbackURL: configAuth.googleAuth.callbackURL,
        passReqToCallback: true //allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },

    // facebook will send back the token and profile
    function(req, token, refreshToken, profile, done) {
        // asynchronous
        process.nextTick(function() {

            //check if the user is already logged in
            if (!req.user) {

                //find the user in the database based on their facebook id
                User.findOne({'google.id': profile.id}, function(err, user) {

                    //if there is an error, stop everything and return
                    if (err)
                        return done(err);

                    //if the user is found, then log them in
                    if (user) {
                        return done(null, user); //user found, return that user

                        //if there is a user id already but no token (user was linked at one point and then removed)
                        //just add our token and profile information
                        if (!user.google.token) {
                            user.google.token = token;
                            user.google.name = profile.name;
                            user.google.email = profile.emails[0].value
                            
                            user.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }
                    } else {
                        console.log('creating a new user');
                        //if there is no user found with that google id, create that user
                        var newUser = new User();

                        //set all of the google information in our user model
                        newUser.google.id    = profile.id;
                        newUser.google.token = token;
                        newUser.google.name = profile.name;
                        newUser.google.email = profile.emails[0].value; // pull the first email

                        //save our user to the database
                        newUser.save(function(err) {
                            if (err)
                                throw err;

                            //if successful, return the new user
                            return done(null, newUser);
                        });
                    }
                });
            } else {
                // user already exists and is logged in, we have to link accounts
                var user = req.user; //pull the user out of the session

                //update the current users google credentials
                user.google.id    = profile.id;
                user.google.token = token;
                user.google.name  = profile.name;
                user.google.email = profile.emails[0].value; // pull the first email

                //save the user
                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
        });
    }));
};

module.exports = googleStrat;