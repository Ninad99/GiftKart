const bcrypt = require("bcrypt");
const { validationResult } = require('express-validator');

const Admin = require("../models/admin");
const Product = require("../models/product");
const Order = require('../models/order');

exports.getUploadProduct = (req, res, next) => {
	return res.render("admin/add-product", {
		pageTitle: "GiftKart Admin | Add Product",
		path: "/admin/add-product",
		editing: false,
		hasError: false,
		message: null,
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

	let occasionArr = [];
	let categoryArr = [];

	if(req.body.occasion){
		if(req.body.occasion.length > 1)
			occasionArr = req.body.occasion;
		else
			occasionArr.push(req.body.occasion);
	}
	
	if(req.body.category){
		if(req.body.category.length > 1)
			categoryArr = req.body.category;
		else
			categoryArr.push(req.body.category);
	}
	
	const newProduct = {
		title: req.body.title,
		price:  parseInt(req.body.price),
		description: req.body.description,
		imageUrl: req.body.imageUrl,
		category: categoryArr,
		quantity: parseInt(req.body.quantity),
		ages: {
			min: parseInt(req.body.minage),
			max: parseInt(req.body.maxage)
		},
		gender: req.body.gender,
		occasion: occasionArr
	};

	if (!errors.isEmpty()) {
		return res.status(422).render('admin/add-product', {
			pageTitle: 'GiftKart Admin | Add Product',
			path: '/admin/add-product',
			editing: false,
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
			editing: false,
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
			editing: false,
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

exports.getEditProduct = (req, res, next) => {
	const editMode = req.query.edit;
	if (!editMode) {
		return res.redirect('/');
	}
	const productId = req.params.productId;
	Product.findById(productId)
		.then(product => {
			if (!product) {
					return res.redirect('/');
			}
			res.render('admin/add-product', {
				pageTitle: 'Edit Product',
				path: '/admin/edit-product',
				editing: editMode,
				hasError: false,
				message: null,
				oldInput: product,
				validationErrors: []
			});
		})
		.catch(err => console.log(err));
}

exports.postEditProduct = (req, res, next) => {
	const prodId = req.body.productId;
	const errors = validationResult(req);

	const updatedProduct = {
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
			pageTitle: 'Edit Product',
			path: '/admin/edit-product',
			editing: false,
			hasError: true,
			oldInput: {
				...updatedProduct,
				_id: prodId
			},
			errorMessage: errors.array()[0].msg,
			validationErrors: errors.array()
		});
	}

	Product.findById(prodId)
		.then(product => {
			product.title = updatedProduct.title;
			product.price = updatedProduct.price;
			product.description = updatedProduct.description;
			product.imageUrl = updatedProduct.imageUrl;
			product.category = updatedProduct.category;
			product.quantity = updatedProduct.quantity;
			product.ages.min = updatedProduct.ages.min;
			product.ages.max = updatedProduct.ages.max;
			product.gender = updatedProduct.gender;
			product.occasion = updatedProduct.occasion;

			return product.save()
				.then(result => {
					console.log('updated product', result);
					res.redirect('/admin/products');
				})
			})
		.catch(err => console.log(err));
}

exports.getAdminOrders = (req, res, next) => {
	Order.find()
		.then(orders => {
			return res.render('admin/orders', {
				pageTitle: 'View Orders | Admin',
				path: '/admin/orders',
				orders: orders
			})
		})
		.catch(err => console.log(err));
}

exports.postAdminOrderStatus = (req, res, next) => {
	const { orderId, orderStatus } = req.body;

	Order.findById(orderId)
		.then(order => {
			order.status = orderStatus;
			return order.save();
		})
		.then(result => {
			return Order.find();
		})
		.then(orders => {
			return res.render('admin/orders', {
				pageTitle: 'View Orders | Admin',
				path: '/admin/orders',
				orders: orders
			})
		})
		.catch(err => console.log(err));
}
