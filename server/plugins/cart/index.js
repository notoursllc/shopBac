const Joi = require('joi');
const Boom = require('@hapi/boom');


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {

        server.dependency(
            ['BookshelfOrm', 'Core', 'Products'],
            function (server) {
                const CartCtrl = new (require('./controllers/CartCtrl'))(server);
                const CartItemCtrl = new (require('./controllers/CartItemCtrl'))(server);
                const CartRefundCtrl = new (require('./controllers/CartRefundCtrl'))(server);

                server.route([
                    {
                        method: 'GET',
                        path: '/cart',
                        options: {
                            description: 'Gets a shopping cart for the given ID',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid(),
                                    tenant_id: Joi.string().uuid(),
                                    ...CartCtrl.getWithRelatedSchema()
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.fetchOneForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: '/carts/closed',
                        options: {
                            description: 'Gets a list of closed carts',
                            auth: {
                                strategies: ['session']
                                // strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    tenant_id: CartCtrl.getSchema().tenant_id,
                                    ...CartCtrl.getPaginationSchema(),
                                    ...CartCtrl.getWithRelatedSchema()
                                })
                            },
                            handler: (request, h) => {
                                request.query.closed_at = {null: false};

                                return CartCtrl.fetchAllForTenantHandler(
                                    request,
                                    h,
                                    { withRelated: CartCtrl.getWithRelatedFetchConfig(request.query, CartCtrl.getAllCartRelations()) }
                                );
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
                                return CartCtrl.setShippingAddressHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: '/cart/order',
                        options: {
                            description: 'Gets a closed cart by ID, as well as the related ShipEngine data (label)',
                            auth: {
                                strategies: ['session']
                            },
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.getOrderHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: '/cart/order/resend-confirmation',
                        options: {
                            description: 'Re-sends the order confirmation email for a given closed cart',
                            auth: {
                                strategies: ['session']
                            },
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.resendOrderConfirmaionHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: '/cart/shipped',
                        options: {
                            description: 'Sets the Cart as shipped by setting or unsetting the shipped_at value',
                            auth: {
                                strategies: ['session']
                            },
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid(),
                                    tenant_id: Joi.string().uuid(),
                                    shipped: Joi.boolean().optional()
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.cartShippedHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: '/cart/refund',
                        options: {
                            description: 'Refunds money to the customer',
                            auth: {
                                strategies: ['session']
                            },
                            validate: {
                                payload: Joi.object({
                                    ...CartRefundCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return CartRefundCtrl.addRefundHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: '/cart/refunds',
                        options: {
                            description: 'Gets a list of refunds',
                            auth: {
                                strategies: ['session']
                                // strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    ...CartRefundCtrl.getSchema(),
                                    ...CartRefundCtrl.getPaginationSchema()
                                })
                            },
                            handler: (request, h) => {
                                return CartRefundCtrl.fetchAllForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: '/cart/refunds/summary',
                        options: {
                            description: 'Gets a list of refunds',
                            auth: {
                                strategies: ['session']
                            },
                            validate: {
                                query: Joi.object({
                                    cart_id: Joi.string().uuid().required(),
                                    ...CartRefundCtrl.getTenantIdSchema()
                                })
                            },
                            handler: (request, h) => {
                                return CartRefundCtrl.getCartRefundSummaryHandler(request, h);
                            }
                        }
                    },


                    /******************
                     * CART ITEM
                     ******************/
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
                    //  {
                    //     method: 'GET',
                    //     path: '/cart/shipping/rate',
                    //     options: {
                    //         description: 'Gets the ShipEngine rate by ID',
                    //         auth: {
                    //             strategies: ['session']
                    //         },
                    //         validate: {
                    //             query: Joi.object({
                    //                 rate_id: Joi.string(),
                    //                 tenant_id: Joi.string().uuid().required()
                    //             })
                    //         },
                    //         handler: (request, h) => {
                    //             return CartCtrl.getShippingRateHandler(request, h);
                    //         }
                    //     }
                    // },
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
                    {
                        method: 'POST',
                        path: '/cart/shipping/label',
                        options: {
                            description: 'Buys a shipping label from ShipEngine',
                            auth: {
                                // strategies: ['session']
                            },
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(), // the cart id
                                    tenant_id: Joi.string().uuid().required(),
                                })
                            },
                            handler: (request, h) => {
                                return CartCtrl.buyShippingLabelForCartHandler(request, h);
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
                            description: 'Returns a payment intent ID from Stripe',
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
                                return CartCtrl.getStripeOrderHandler(request, h);
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
                                    ...CartCtrl.getTenantIdSchema()
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

                server.app.bookshelf.model(
                    'CartRefund',
                    require('./models/CartRefund')(baseModel, server.app.bookshelf, server)
                );
            }
        );
    }
};
