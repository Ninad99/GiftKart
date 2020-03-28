const bcrypt = require("bcrypt");
const { validationResult } = require('express-validator');

const Admin = require("../models/admin");
const Product = require("../models/product");

exports.getUploadProduct = (req, res, next) => {
	return res.render("admin/add-product", {
		pageTitle: "GiftKart Admin | Add Product",
		path: "/admin/add-product",
		message: null,
		hasError: false,
		oldInput: {
			title: '',
			price: '',
			description: '',
			imageUrl: '',
			category: '',
			quantity: '',
			ages: {
				min: '',
				max: ''
			},
			gender: '',
			occasion: ''
		},
		validationErrors: []
	});
};

exports.postUploadProduct = async (req, res, next) => {
	const errors = validationResult(req);

	const newProduct = {
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

	if (!errors.isEmpty()) {
		return res.status(422).render('admin/add-product', {
			pageTitle: 'GiftKart Admin | Add Product',
			path: '/admin/add-product',
			hasError: true,
			message: errors.array()[0].msg,
			oldInput: newProduct,
			validationErrors: errors.array()
		});
	}

	try {
		const product = await new Product(newProduct);
		await product.save();
		return res.render('admin/add-product', {
			pageTitle: 'GiftKart Admin | Add Product',
			path: '/admin/add-product',
			hasError: false,
			message: 'Successfully added product!',
			oldInput: {
				title: '',
				price: '',
				imageUrl: '',
				description: '',
				category: '',
				quantity: '',
				ages: {
					min: '',
					max: ''
				},
				gender: '',
				occasion: ''
			},
			validationErrors: []
		})
	} catch (err) {
		return res.render('admin/add-product', {
			pageTitle: 'GiftKart Admin | Add Product',
			path: '/admin/add-product',
			hasError: true,
			message: 'There was an error while saving the product. Check your network connection and retry.',
			oldInput: newProduct,
			validationErrors: []
		})
	}
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

exports.getProducts = (req, res, next) => {
	Product.find()
		.then(products => {
			res.render('admin/products', {
				prods: products,
				pageTitle: 'Admin Products',
				path: '/admin/products'
			});
		})
		.catch(err => console.log(err));
}

exports.postDeleteProduct = (req, res, next) => {
	const prodId = req.body.productId;
	Product.deleteOne({ _id: prodId })
		.then(result => {
			console.log('DELETED PRODUCT');
			res.redirect('/admin/products');
		})
		.catch(err => console.log(err));
}
