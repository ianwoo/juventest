// app/models/org.js
// load the things we need
var mongoose = require('mongoose');
var User = require('./user');

// define the schema for our organisation model
var orgSchema = mongoose.Schema({
	orgname: String,
	description: String,
	created_at: {country: String, city: String},
	admins_array: [{
		admin: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
	}],
	location: {country: String, city: String},
	profile_image_url: String,
	cover_image_url: String,
	events_array: [],
	members_array: [{
		member: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
	}],
	invitations_array: [{
		invited: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
	}]
});

module.exports = mongoose.model('Org', orgSchema);