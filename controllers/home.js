const Product = require("../models/product");

exports.getHome = (req, res, next) => {
	return res.render("shop/index", {
		pageTitle: "Some shit",
		path: "/"
	});
};

exports.recommendProducts = (req, res, next) => {
	console.log(req.body);
	//handle further

	Product.find()
		.then(products => {
			return res.render("shop/recommend-products", {
				prods: products,
				pageTitle: "Recommend Products",
				path: "/recommend-products"
			});
		})
		.catch(err => console.log(err));
};
