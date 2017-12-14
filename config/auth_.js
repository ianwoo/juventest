// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : '', // and wouldn't you like to know?
        'clientSecret'  : '', // go get one of these
        'callbackURL'   : 'http://localhost:8080/auth/facebook/callback'
    },

    'googleAuth' : {
        'clientID'      : '', // for yourself
        'clientSecret'  : '', // and make your own APIs, it's easy
        'callbackURL'   : 'http://localhost:8080/auth/google/callback'
    }

};