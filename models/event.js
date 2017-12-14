// app/models/event.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our event model
var eventSchema = mongoose.Schema({
	org: {type: mongoose.Schema.Types.ObjectId, ref: 'Org'},
	name: String,
	date: {year: Number, month: Number, day: Number, hour: Number, minute: Number},
	location: {country: String, city: String},
	price: {currency: String, amount: Number},
	image_url: String,
	participants_array: [{
		member: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
	}]
});

module.exports = mongoose.model('Event', eventSchema);