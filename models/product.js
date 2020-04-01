const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
	title: {
		type: String,
		trim: true,
		required: true
	},
	price: {
		type: Number,
		required: true
	},
	description: {
		type: String,
		trim: true,
		required: true
	},
	imageUrl: {
		type: String,
		trim: true,
		required: true
	},
	category: {
		type: [String],
		trim: true,
		required: true
	},
	quantity: {
		type: Number,
		required: true
	},
	ages: {
		min: { type: Number, required: true },
		max: { type: Number, required: true }
	},
	gender: {
		type: String,
		trim: true,
		required: true
	},
	occasion: {
		type: [String],
		trim: true,
		required: true
	}
});

module.exports = mongoose.model("Product", productSchema);
