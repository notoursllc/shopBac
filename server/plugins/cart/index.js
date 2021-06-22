const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {

        server.dependency(
            ['BookshelfOrm', 'Core', 'Products', 'Shipping', 'Payment'],
            function (server) {
                const CartCtrl = new (require('./controllers/CartCtrl'))(server);
                const CartItemCtrl = new (require('./controllers/CartItemCtrl'))(server);

                server.route([
                    // {
                    //     method: 'POST',
                    //     path: '/cart/create',
                    //     options: {
                    //         description: 'Creates a new Cart',
                    //         auth: {
                    //             strategies: ['storeauth']
                    //         },
                    //         validate: {
                    //             payload: Joi.object({
                    //                 tenant_id: Joi.string().uuid()
                    //             })
                    //         },
                    //         handler: (request, h) => {
                    //             return CartCtrl.createHandler(request, h);
                    //         }
                    //     }
                    // },
                    {
                        method: 'GET',
                        path: '/cart',
                        options: {
                            description: 'Gets a shopping cart for the given ID',
                            auth: {
                                strategies: ['storeauth']
                            },
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid(),
                                    tenant_id: Joi.string().uuid(),
                                    relations: Joi.boolean().optional()
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.getByIdHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: '/cart/upsert',
                        options: {
                            description: 'Creates or updates a Cart',
                            auth: {
                                strategies: ['storeauth']
                            },
                            validate: {
                                payload: Joi.object({
                                    ...CartCtrl.getSchema(true)
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: '/cart/shippingaddress',
                        options: {
                            description: 'Sets the shipping address in the cart, and optionally validates it',
                            auth: {
                                strategies: ['storeauth']
                            },
                            validate: {
                                payload: Joi.object({
                                    ...CartCtrl.getSchema(true),
                                    validate: Joi.boolean().optional()
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.setShippingAddress(request, h);
                            }
                        }
                    },

                    {
                        method: 'POST',
                        path: '/cart/item',
                        options: {
                            description: 'Adds an item to Cart',
                            auth: {
                                strategies: ['storeauth']
                            },
                            validate: {
                                payload: Joi.object({
                                    ...CartItemCtrl.getSchema(),
                                    clear_shipping_rate: Joi.boolean().optional()
                                })
                            },
                            handler: (request, h) => {
                                return CartItemCtrl.createHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: '/cart/item',
                        options: {
                            description: 'Updates a CartItem',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                payload: Joi.object({
                                    ...CartItemCtrl.getSchema(true),
                                    clear_shipping_rate: Joi.boolean().optional()
                                })
                            },
                            handler: (request, h) => {
                                return CartItemCtrl.updateHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: '/cart/item',
                        options: {
                            description: 'Removes an item from the cart',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required(),
                                    clear_shipping_rate: Joi.boolean().optional()
                                })
                            },
                            handler: (request, h) => {
                                return CartItemCtrl.deleteHandler(request, h);
                            }
                        }
                    },


                    /******************
                     * SHIPPING
                     ******************/

                    {
                        method: 'POST',
                        path: '/cart/shipping/estimate',
                        options: {
                            description: 'Returns shipping rates for the cart',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required(),
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.shippingRateEstimateHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: '/cart/shipping/rate',
                        options: {
                            description: 'Persists a selected shipping rate for the cart.',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required(),
                                    rate_id: Joi.string().required()
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.selectShippingRateHandler(request, h);
                            }
                        }
                    },


                    /******************
                     * STRIPE
                     ******************/
                     {
                        method: 'GET',
                        path: '/cart/payment',
                        options: {
                            description: 'Gets payment info for the given cart id',
                            auth: {
                                strategies: ['storeauth']
                            },
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid(),
                                    tenant_id: Joi.string().uuid(),
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.getPaymentHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: '/cart/payment/intent',
                        options: {
                            description: 'Returns a PaymentIntent object from stripe',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required(),
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.getStripePaymentIntentHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: '/cart/payment',
                        options: {
                            description: 'Persist a successful payment',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required(),
                                    stripe_payment_intent_id: Joi.string().required()
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.paymentSuccessHandler(request, h);
                            }
                        }
                    },


                    /******************
                     * PAYPAL
                     ******************/
                    {
                        method: 'POST',
                        path: '/cart/payment/paypal',
                        options: {
                            description: 'Returns a paypal transaction id', // is this the right description?
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.createPaypalPaymentHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: '/cart/payment/paypal',
                        options: {
                            description: 'Executes a PayPal payment',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required(),
                                    token: Joi.string().required()
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.executePaypalPaymentHandler(request, h);
                            }
                        }
                    },

                    /*
                    {
                        method: 'GET',
                        path: '/cart/get',
                        options: {
                            description: 'Finds the cart for the given jwt user',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            pre: [
                                { method: CartCtrl.pre_cart, assign: 'm1' }
                            ],
                            handler: CartCtrl.cartGetHandler
                        }
                    },
                    {
                        method: 'DELETE',
                        path: '/cart/item',
                        options: {
                            description: 'Removes an item from the cart',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required() // payment ID
                                })
                            },
                            pre: [
                                { method: CartCtrl.pre_cart, assign: 'm1' }
                            ],
                            handler: CartCtrl.cartItemRemoveHandler
                        }
                    },
                    {
                        method: 'POST',
                        path: '/cart/item/qty',
                        options: {
                            description: 'Updates the quantity of a shopping cart item (CartItem model)',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(), // cart item id
                                    qty: Joi.number().min(1).required()
                                })
                            },
                            pre: [
                                { method: CartCtrl.pre_cart, assign: 'm1' }
                            ],
                            handler: CartCtrl.cartItemQtyHandler
                        }
                    },
                    {
                        method: 'POST',
                        path: '/cart/shipping/address',
                        options: {
                            description: 'Sets the shipping address for the cart, calculates the sales tax, and gets shipping rate',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                payload: Joi.object({
                                    ...CartCtrl.getShippingAttributesSchema()
                                })
                            },
                            pre: [
                                { method: CartCtrl.pre_cart, assign: 'm1' }
                            ],
                            handler: CartCtrl.cartShippingSetAddressHandler
                        }
                    },
                    {
                        method: 'GET',
                        path: '/cart/shipping/rates',
                        options: {
                            description: 'Gets a list of shipping rates for the cart',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            pre: [
                                { method: CartCtrl.pre_cart, assign: 'm1' }
                            ],
                            handler: CartCtrl.getCartShippingRatesHandler
                        }
                    },
                    {
                        method: 'POST',
                        path: '/cart/shipping/rate',
                        options: {
                            description: 'Sets the selected shipping rate for the cart',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                payload: Joi.object({
                                    shipping_rate: Joi.object().unknown()
                                })
                            },
                            pre: [
                                { method: CartCtrl.pre_cart, assign: 'm1' }
                            ],
                            handler: CartCtrl.cartShippingRateHandler
                        }
                    },
                    {
                        method: 'POST',
                        path: '/cart/checkout',
                        options: {
                            description: 'Complete the transaction',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                // NOTE: shipping is not required here because the 'cart/shipping/address' route
                                // should have been called before this route, which persists the shipping info.
                                payload: Joi.object({
                                    nonce: Joi.string().trim().required(),
                                    ...CartCtrl.getBillingAttributesSchema()
                                })
                            },
                            pre: [
                                { method: CartCtrl.pre_cart, assign: 'm1' }
                            ],
                            handler: CartCtrl.cartCheckoutHandler
                        }
                    },

                    // PAYPAL
                    // {
                    //     method: 'POST',
                    //     path: '/cart/paypal/create',
                    //     options: {
                    //         description: 'Returns a paypal transaction id', // is this the right description?
                    //         handler: CartCtrl.paypalCreate
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
                    //         handler: CartCtrl.paypalCaptureOrder
                    //     }
                    // },

                    {
                        method: 'POST',
                        path: '/cart/paypal/create-payment',
                        options: {
                            description: 'Returns a paypal transaction id', // is this the right description?
                            pre: [
                                { method: CartCtrl.pre_cart, assign: 'm1' }
                            ],
                            handler: CartCtrl.paypalCreatePayment  // working
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
                                { method: CartCtrl.pre_cart, assign: 'm1' }
                            ],
                            handler: CartCtrl.paypalExecutePayment
                        }
                    },

                    {
                        method: 'GET',
                        path: '/cart/{param*}',
                        options: {
                            description: 'Returns 404 response',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            handler: (request, h) => {
                                throw Boom.notFound();
                            }
                        }
                    }
                    */
                ]);


                // LOADING BOOKSHELF MODEL:
                // let baseModel = bookshelf.Model.extend({});
                const baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

                server.app.bookshelf.model(
                    'Cart',
                    require('./models/Cart')(baseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'CartItem',
                    require('./models/CartItem')(baseModel, server.app.bookshelf, server)
                );
            }
        );
    }
};
