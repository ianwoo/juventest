// app/routes.js
var Org = require('../models/org');
var Event = require('../models/event');
var User = require('../models/user');

module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        var profileOrgs;
        var queryId = req.user._id;
        //query Org schema for all Orgs with user in members array
        Org.find({'members_array.member':{$in:queryId}}, function(err, profileOrgs) {
            Org.find({'invitations_array.invited':{$in:queryId}}, function(err, invitedOrgs) {
                res.render('profile.ejs', {
                    user : req.user, // get the user out of session and pass to template
                    orgs : profileOrgs, //pass the Orgs which user belongs to for "Your Orgs"
                    invited : invitedOrgs
                });
            });
        });
    });

    //add email
    app.post('/email', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = req.body.email;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    //create an org
    app.post('/org', isLoggedIn, function(req, res) {
        // create the org object
        var newOrg              = new Org(req.body);
        newOrg.admins_array[0] = {admin: req.user._id}; //add creator as first admin in admin array
        newOrg.members_array[0] = {member: req.user._id}; //add creator as first member in member array
        newOrg.save(function(err) {
            res.redirect('/profile');
        });
    });

    //accept an invitation
    app.post('/acceptinvite', isLoggedIn, function(req, res) {
        //find the org and push invited user into members_array
        Org.findByIdAndUpdate(req.body._id, {$push: {'members_array':{'member':req.user._id}}})
           .exec (function (err, updateQuery1){
                console.log(updateQuery1);
                //find the org and pull invited user from invitations_array
                Org.findByIdAndUpdate(req.body._id, {$pull: {'invitations_array':{'invited':req.user._id}}})
                    .exec(function(err, updateQuery2){
                        console.log(updateQuery2);
                        res.redirect('/profile');
                    });
            });
    });

    // =====================================
    // ORG PAGE ============================
    // =====================================
    app.post('/orgpage', isLoggedIn, function(req,res) {
        var loadedOrg;
        //query to find ONE org that matches req.body (_id, hidden input in form)
        Org.findOne(req.body)
            .populate('admins_array.admin')
            .populate('members_array.member')
            .populate('invitations_array.invited') //we can probably refactor these three populates (see line 125)
            .exec(function(err, loadedOrg) {
                console.log(loadedOrg);
                res.render('org.ejs', {
                    user : req.user, // get the user out of session and pass to template
                    org : loadedOrg
                });
            });
    });

    //DELETE the org (_id, hidden input in form), .post used to pass _id to backend
    app.post('/deleteorg', isLoggedIn, function(req,res) {
        Org.findByIdAndRemove(req.body._id).then(function (result){
            console.log(result);
            console.log('ORG DELETED.');
            res.redirect('/profile');
        });  
    });

    //invite another user to the org
    app.post('/invite', isLoggedIn, function(req,res){
        //first query: find the user, pass to *invited*
        User.findOne({'local.username':req.body.username}, function (err, invited){
            console.log(invited);
            //second query: push *invited* user to invitations_array
            Org.findByIdAndUpdate(req.body._id, {$push: {'invitations_array': {'invited':invited}}})
                .exec(function (err, query) {
                    //third query AFTER second query has been executed, pull current Org and reload
                    Org.findOne({'_id': query._id})
                        .populate('admins_array.admin')
                        .populate('members_array.member')
                        .populate('invitations_array.invited') //we can probably refactor these three populates (see line 94)
                        .exec(function (err, reload) {
                            res.render('org.ejs', {
                                user : req.user, // get the user out of session and pass to template
                                org : reload
                            });
                        });
                });
        });
    });

    //make a user an admin
    app.post('/makeadmin', isLoggedIn, function(req,res){
        //find current org on backend
        Org.findById(req.body.orgId)
            .exec(function (err, thisOrg){
                console.log(thisOrg);
                for (var counter = 0; counter < thisOrg.admins_array.length; counter++){
                    //check to see if user is already an admin
                    if (thisOrg.admins_array[counter].admin == req.body.memberId){
                        //find current org on backend again in order to populate and reload
                        Org.findOne({'_id': thisOrg._id})
                            .populate('admins_array.admin')
                            .populate('members_array.member')
                            .populate('invitations_array.invited')
                            .exec(function(err, reload) {
                                    res.render('org.ejs', {
                                    user : req.user, // get the user out of session and pass to template
                                    org : reload
                                });
                            });
                    }
                }
                //push member id into admins array, when org page reloads it will be populated
                Org.findByIdAndUpdate(req.body.orgId, {$push: {'admins_array':{'admin':req.body.memberId}}})
                    .exec(function (err, query){
                        //pull current Org and reload
                        Org.findOne({'_id': query._id})
                            .populate('admins_array.admin')
                            .populate('members_array.member')
                            .populate('invitations_array.invited') //we can probably refactor these three populates (see line 94)
                            .exec(function (err, reload) {
                                res.render('org.ejs', {
                                    user : req.user, // get the user out of session and pass to template
                                    org : reload
                                });
                            });
                    });    
            });
    });

    app.post('/removeadmin', isLoggedIn, function(req, res) {
        Org.findByIdAndUpdate(req.body.orgId, {$pull: {'admins_array':{'admin':req.body.adminId}}})
            .exec(function (err, query){
                Org.findOne({'_id': query._id})
                    .populate('admins_array.admin')
                    .populate('members_array.member')
                    .populate('invitations_array.invited') //we can probably refactor these three populates (see line 94)
                    .exec(function (err, reload) {
                        res.render('org.ejs', {
                            user : req.user, // get the user out of session and pass to template
                            org : reload
                        });
                    });
            });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));

    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));
    // =============================================================================
    // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
    // =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));
        //closed

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
        }));
        //closed

    // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

        // the callback after google has authorized the user
        app.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
        }));
        //closed

    // =============================================================================
    // UNLINK ACCOUNTS =============================================================
    // =============================================================================
    // used to unlink accounts. for social accounts, just remove the token
    // for local account, remove email and password
    // user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
           res.redirect('/profile');
        });
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}