const bcrypt = require("bcrypt");
const Admin = require("../models/admin");
const Product = require("../models/product");

exports.getUploadProduct = (req, res, next) => {
	return res.render("admin/add-product", {
		pageTitle: "Admin Login",
		path: "/admin/login",
		errorMessage: null,
		oldInput: {
			email: "",
			password: ""
		}
	});
};

exports.postUploadProduct = async (req, res, next) => {
	
	const prod = {
		title: req.body.title,
		price:  parseInt(req.body.price),
		description: req.body.description,
		imageUrl: req.body.imageUrl,
		category: req.body.category,
		quantity: parseInt(req.body.quantity),
		ages: {
			min: parseInt(req.body.minage),
			max: parseInt(req.body.maxage)
		},
		gender: req.body.gender,
		occasion: req.body.occasion
	};

	let errorMessage = null;

	try {
		const product = await new Product(prod);
		await product.save();
		console.log(prod);
		errorMessage = "Product Added successfully";
	} catch (e) {
		errorMessage = "error";
	}

	return res.status(200).render("admin/add-product", {
		pageTitle: "add-product",
		path: "/admin/add-product",
		errorMessage: errorMessage
	});
};

exports.getAdminLogin = (req, res, next) => {
	return res.render("admin/admin-login", {
		pageTitle: "Admin Login",
		path: "/admin/login",
		errorMessage: null,
		oldInput: {
			email: "",
			password: ""
		}
	});
};

exports.postAdminLogin = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;

	Admin.findOne({ email: email }).then(admin => {
		if (admin) {
			bcrypt
				.compare(password, admin.password)
				.then(passwordMatch => {
					if (passwordMatch) {
						req.session.isLoggedIn = true;
						req.session.isAdmin = true;
						req.session.user = admin;
						return req.session.save(err => {
							if (!err) {
								res.redirect("/admin/add-product");
							} else {
								console.log(err);
							}
						});
					} else {
						return res.status(422).render("admin/admin-login", {
							pageTitle: "Admin Login",
							path: "/admin/login",
							errorMessage: "Invalid admin email or password",
							oldInput: {
								email: email,
								password: password
							}
						});
					}
				})
				.catch(err => {
					console.log(err);
				});
		} else {
			return res.status(400).render("admin/admin-login", {
				pageTitle: "Admin Login",
				path: "/admin/login",
				errorMessage: "Invalid admin email or password",
				oldInput: {
					email: email,
					password: password
				}
			});
		}
	});
};
