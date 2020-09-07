'use strict';

const Joi = require('@hapi/joi');
const PaymentController = require('./paymentController');


const after = function (server) {
    server.route([
        {
            method: 'GET',
            path: '/payment',
            options: {
                description: 'Returns payment data for a given id',
                auth: {
                    strategies: ['storeauth', 'session']
                },
                validate: {
                    query: Joi.object({
                        id: Joi.string().max(50),
                    })
                },
                handler: PaymentController.getPaymentHandler
            }
        },
        {
            method: 'GET',
            path: '/payments',
            options: {
                description: 'Gets a list of payments',
                handler: PaymentController.getPaymentsHandler
            }
        },
        {
            method: 'POST',
            path: '/payment/shipping/packingslip',
            options: {
                description: 'Creates a packing slip for a given payment ID',
                auth: {
                    strategies: ['storeauth', 'session']
                },
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: PaymentController.shippingPackingSlipHandler
            }
        },
        {
            method: 'POST',
            path: '/payment/shipping/label',
            options: {
                description: 'Creates a shipping label for a given payment ID',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(), // payment id
                        shipment: Joi.object().keys({
                            address_from: Joi.object().unknown().required(),
                            address_to: Joi.object().unknown().required(),
                            parcels: Joi.array().required(),
                        }).required(),
                        carrier_account: Joi.string().required(),
                        servicelevel_token: Joi.string().required(),
                        label_file_type: Joi.string().optional(),
                        metadata: Joi.string().optional(),
                    })
                },
                handler: PaymentController.purchaseShippingLabelHandler
            }
        },
        {
            method: 'GET',
            path: '/payment/shipping/label',
            options: {
                description: 'Gets a shipping label for a given payment ID',
                auth: {
                    strategies: ['storeauth', 'session']
                },
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: PaymentController.getShippingLabelHandler
            }
        },
        {
            method: 'DELETE',
            path: '/payment/shipping/label',
            options: {
                description: 'Deletes a shipping label',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()  // payment ID
                    })
                },
                handler: PaymentController.deleteShippingLabelHandler
            }
        }
    ]);


    // LOADING BOOKSHELF MODEL:
    // let baseModel = bookshelf.Model.extend({});
    let baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'Payment',
        require('./models/Payment')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        PaymentController.setServer(server);

        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
