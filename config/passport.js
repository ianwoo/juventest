// config/passport.js

// load up the user model
var User = require('../models/user');

// load authentications
var configAuth = require('./auth');

module.exports = function (passport) {

    //load serializer
    var serializer = require('../passport/serializer');
    serializer(User, passport);

    // load local strategies
    var localStrat = require('../passport/localStrat');
    localStrat(User, passport);

    // load facebook strategies
    var facebookStrat = require('../passport/facebookStrat');
    facebookStrat(User, passport, configAuth);

    // load google strategies
    var googleStrat = require('../passport/googleStrat');
    googleStrat(User, passport, configAuth);

};