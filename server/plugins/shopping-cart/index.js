'use strict';

const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const ShoppingCartController = require('./shoppingCartController');


const after = function (server) {
    server.route([
        {
            method: 'GET',
            path: '/cart/get',
            options: {
                description: 'Finds the cart for the given jwt user',
                pre: [
                    { method: ShoppingCartController.pre_cart, assign: 'm1' },
                ],
                handler: ShoppingCartController.cartGetHandler
            }
        },
        {
            method: 'POST',
            path: '/cart/item/add',
            options: {
                description: 'Adds a new item to the cart',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        options: Joi.object({
                            size: Joi.string().uppercase().min(6), // 'SIZE_?'
                            qty: Joi.number().min(1).required()
                        }).required()
                    })
                },
                handler: ShoppingCartController.cartItemAddHandler
            }
        },
        {
            method: 'POST',
            path: '/cart/item/remove',
            options: {
                description: 'Removes an item from the cart',
                validate: {
                    payload: {
                        id: Joi.string().uuid().required()
                    }
                },
                pre: [
                    { method: ShoppingCartController.pre_cart, assign: 'm1' },
                ],
                handler: ShoppingCartController.cartItemRemoveHandler
            }
        },
        {
            method: 'POST',
            path: '/cart/item/qty',
            options: {
                description: 'Updates the quantity of a shopping cart item (ShoppingCartItem model)',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),  // cart item id
                        qty: Joi.number().min(1).required()
                    })
                },
                pre: [
                    { method: ShoppingCartController.pre_cart, assign: 'm1' },
                ],
                handler: ShoppingCartController.cartItemQtyHandler
            }
        },
        {
            method: 'POST',
            path: '/cart/shipping/address',
            options: {
                description: 'Sets the shipping address for the cart and calculates the sales tax',
                validate: {
                    payload: Joi.reach(ShoppingCartController.getShoppingCartModelSchema(), 'shipping')
                },
                pre: [
                    { method: ShoppingCartController.pre_cart, assign: 'm1' },
                ],
                handler: ShoppingCartController.cartShippingSetAddressHandler
            }
        },
        {
            method: 'GET',
            path: '/cart/shipping/rates',
            options: {
                description: 'Gets a list of shipping rates for the cart',
                pre: [
                    { method: ShoppingCartController.pre_cart, assign: 'm1' },
                ],
                handler: ShoppingCartController.getCartShippingRatesHandler
            }
        },
        {
            method: 'POST',
            path: '/cart/shipping/rate',
            options: {
                description: 'Sets the selected shipping rate for the cart',
                validate: {
                    payload: Joi.reach(ShoppingCartController.getShoppingCartModelSchema(), 'shipping_rate')
                },
                pre: [
                    { method: ShoppingCartController.pre_cart, assign: 'm1' },
                ],
                handler: ShoppingCartController.cartShippingRateHandler
            }
        },
        {
            method: 'POST',
            path: '/cart/checkout',
            options: {
                description: 'Complete the transaction',
                validate: {
                    // NOTE: shipping is not required here because the 'cart/shipping/address' route
                    // should have been called before this route, which persists the shipping info.
                    payload: Object.assign(
                        {},
                        { nonce: Joi.string().trim().required() },
                        ShoppingCartController.getBillingAttributesSchema()
                    )
                },
                pre: [
                    { method: ShoppingCartController.pre_cart, assign: 'm1' },
                ],
                handler: ShoppingCartController.cartCheckoutHandler
            }
        },

        // PAYPAL
        // {
        //     method: 'POST',
        //     path: '/cart/paypal/create',
        //     options: {
        //         description: 'Returns a paypal transaction id', // is this the right description?
        //         handler: ShoppingCartController.paypalCreate
        //     }
        // },
        // {
        //     method: 'POST',
        //     path: '/cart/paypal/checkout',
        //     options: {
        //         description: 'Checkout using PayPal', // is this the right description?
        //         validate: {
        //             payload: Joi.object({
        //                 orderId: Joi.string().required(),  // cart item id
        //                 // orderId: Joi.number().min(1).required()
        //             })
        //         },
        //         handler: ShoppingCartController.paypalCaptureOrder
        //     }
        // },

        {
            method: 'POST',
            path: '/cart/paypal/create-payment',
            options: {
                description: 'Returns a paypal transaction id', // is this the right description?
                pre: [
                    { method: ShoppingCartController.pre_cart, assign: 'm1' },
                ],
                handler: ShoppingCartController.paypalCreatePayment  // working
            }
        },
        {
            method: 'POST',
            path: '/cart/paypal/execute-payment',
            options: {
                description: 'Executes a PayPal payment',
                validate: {
                    payload: Joi.object({
                        paymentToken: Joi.string().required()
                    })
                },
                pre: [
                    { method: ShoppingCartController.pre_cart, assign: 'm1' },
                ],
                handler: ShoppingCartController.paypalExecutePayment
            }
        },

        {
            method: 'GET',
            path: '/cart/{param*}',
            options: {
                description: 'Returns 404 response',
                handler: (request, h) => {
                    throw Boom.notFound();
                }
            }
        }
    ]);


    // LOADING BOOKSHELF MODEL:
    // let baseModel = bookshelf.Model.extend({});
    let baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'ShoppingCart',
        require('./models/ShoppingCart')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'ShoppingCartItem',
        require('./models/ShoppingCartItem')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        ShoppingCartController.setServer(server);
        server.dependency(['BookshelfOrm', 'Core', 'Products', 'Shipping', 'Payment'], after);
    }
};
