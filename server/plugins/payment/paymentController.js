'use strict';

const Joi = require('joi');
const Boom = require('boom');
const isObject = require('lodash.isobject');
const SquareConnect = require('square-connect');
const HelperService = require('../../helpers.service');
const cartController = require('../shopping-cart/shoppingCartController')
const shippoOrdersAPI = require('../shipping/shippoAPI/orders');
const shippoTransactionsAPI = require('../shipping/shippoAPI/transactions');
const squareHelper = require('./squareHelper');
let server = null;

const PAYMENT_TYPE_CREDIT_CARD = 1;
const PAYMENT_TYPE_PAYPAL = 2;

// Configure OAuth2 access token for authorization: oauth2
const defaultClient = SquareConnect.ApiClient.instance;
const oauth2 = defaultClient.authentications['oauth2'];
oauth2.accessToken = squareHelper.getAccessToken()


function getPaymentModel() {
    return server.app.bookshelf.model('Payment');
}


function setServer(s) {
    server = s;
}


/**
 * Gets a payment by a given attribute
 *
 * @param attrName
 * @param attrValue
 * @param withRelatedArr
 */
async function getPaymentByAttribute(attrName, attrValue, withRelatedArr) {
    let fetchObj = null;

    if(Array.isArray(withRelatedArr)) {
        fetchObj = {
            withRelated: withRelatedArr   // example: 'shoppingCart.cart_items.product' // https://stackoverflow.com/questions/35679855/always-fetch-from-related-models-in-bookshelf-js#35841710
        }
    }

    const Payment = await getPaymentModel().query((qb) => {
        qb.where(attrName, '=', attrValue);  // TODO: Is there a SQL injection risk here?
    })
    .fetch(fetchObj);

    // global.logger.debug('PAYMENT BY ATTRIBUTE', {
    //     meta: {
    //         attrName,
    //         attrValue,
    //         payment: (Payment ? Payment.toJSON() : '')
    //     }
    // });

    return Payment;
}


/**
 * Persists some of the transaction data
 *
 * @param cart_id
 * @param payment_type
 * @param transactionJson
 * @returns {Promise}
 */
async function savePayment(cart_id, payment_type, transactionJson) {
    // global.logger.debug('SAVE PAYMENT - TRANSACTION', {
    //     meta: {
    //         transactionJson
    //     }
    // });

    const Payment = await getPaymentModel().forge().save(
        {
            cart_id: cart_id,
            payment_type: payment_type,
            transaction: transactionJson,
        },
        { method: 'insert' }
    );

    // global.logger.debug('SAVE PAYMENT RESULT', {
    //     meta: {
    //         payment: Payment ? Payment.toJSON() : Payment
    //     }
    // });

    return Payment;
}


async function getPaymentsHandler(request, h) {
    try {
        const payments = await HelperService.fetchPage(
            request,
            getPaymentModel(),
            ['shoppingCart.cart_items.product']
        );

        return h.apiSuccess(
            payments, payments.pagination
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.notFound(err);
    }
}


async function getPaymentHandler(request, h) {
    try {
        const Payment = await getPaymentByAttribute(
            'id',
            request.query.id,
            ['shoppingCart.cart_items.product.pics']
        );

        if(!Payment) {
            throw Boom.notFound('Payment not found');
        }

        return h.apiSuccess(
            Payment.toJSON()
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.notFound(err);
    }
}


/**
 * Creates a Shippo "Packing Slip" by Payment ID
 *
 * @param {*} request
 * @param {*} h
 */
async function shippingPackingSlipHandler(request, h) {
    try {
        let packingSlip;
        const Payment = await getPaymentByAttribute(
            'id',
            request.payload.id,
            ['shoppingCart.cart_items.product']
        );

        if(!Payment) {
            throw new Error('Payment does not exist.')
        }

        // If we already have the shippo_order_id then just need to
        // call the Shippo API to return the packing slip
        if(Payment.get('shippo_order_id')) {
            packingSlip = await shippoOrdersAPI.getPackingSlipForOrder(Payment.get('shippo_order_id'));
        }
        else {
            // We dont have an shippo_order_id yet:
            const ShoppingCart = await cartController.getCartByAttribute(
                'id',
                Payment.get('cart_id'),
                cartController.getDefaultWithRelated()
            );

            if(!ShoppingCart) {
                throw new Error('Shopping cart does not exist.')
            }

            const shippoOrder = await cartController.createShippoOrderFromShoppingCart(ShoppingCart);

            // no need to await here:
            Payment.save(
                { shippo_order_id: shippoOrder.object_id },
                { method: 'update', patch: true }
            );

            packingSlip = await shippoOrdersAPI.getPackingSlipForOrder(shippoOrder.object_id);
        }

        return h.apiSuccess(
            packingSlip
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


/**
 * Purchases a Shipping Label from Shippo, by Payment ID
 *
 * @param {*} request
 * @param {*} h
 */
async function purchaseShippingLabelHandler(request, h) {
    try {
        const Payment = await getPaymentByAttribute(
            'id',
            request.payload.id,
        );

        if(!Payment) {
            throw new Error('Payment does not exist.')
        }

        delete request.payload.id;

        const response = await shippoTransactionsAPI.createShippingLabel(request.payload);
        // global.logger.debug('CREATE SHIPPING LABEL RESPONSE', {
        //     meta: {
        //         response
        //     }
        // });

        // no need to await here:
        Payment.save(
            { shippo_transaction_id: response.object_id },
            { method: 'update', patch: true }
        );

        return h.apiSuccess(
            response
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


/**
 * Purchases a Shipping Label from Shippo, by Payment ID
 *
 * @param {*} request
 * @param {*} h
 */
async function getShippingLabelHandler(request, h) {
    try {
        const response = await shippoTransactionsAPI.getShippingLabel(request.query.id);

        // global.logger.debug('GET SHIPPING LABEL RESPONSE', {
        //     meta: {
        //         response
        //     }
        // });

        return h.apiSuccess(
            response
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}

/**
 * Deletes a Shipping Label
 *
 * @param {*} request
 * @param {*} h
 */
async function deleteShippingLabelHandler(request, h) {
    try {
        const Payment = await getPaymentByAttribute(
            'id',
            request.query.id,
        );

        if(!Payment) {
            throw new Error('Payment does not exist.')
        }

        // NOTE: Shippo does not have an API endpoint to delete a transaction
        // document, so the best we can do is to delete the 'shippo_transaction_id'
        // value so a new transaction can be created.

        // no need to await here:
        Payment.save(
            { shippo_transaction_id: null },
            { method: 'update', patch: true }
        );

        return h.apiSuccess({
            id: request.query.id
        });
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


/**
 * Submits a payment to Square
 *
 * @param opts  Options object to pass to braintree.transaction.sale
 * @returns {Promise}
 */
async function runPayment(opts) {
    // global.logger.debug('PAYMENT: runPayment opts', opts);

    let schema = Joi.object().keys({
        idempotency_key: Joi.string().trim().required(),
        amount_money: Joi.object().keys({
            amount: Joi.number().positive().required(),
            currency: Joi.string().trim().required()
        }),
        card_nonce: Joi.string().trim().required(),
        billing_address: Joi.object().unknown().required(),
        shipping_address: Joi.object().unknown().required(),
        buyer_email_address: Joi.string().email()
    });

    const validateResult = schema.validate(opts);
    if (validateResult.error) {
        throw new Error(validateResult.error);
    }

    // CHARGE API:
    // https://github.com/square/connect-javascript-sdk/blob/master/docs/TransactionsApi.md#charge
    try {
        const transactions_api = new SquareConnect.TransactionsApi();

        let data = await transactions_api.charge(
            squareHelper.getLocationId(),
            opts
        );

        // global.logger.debug('SquareConnect.TransactionsApi charge() response', {
        //     meta: data
        // });

        return data;
    }
    catch(error) {
        // trying to build a more coherent error message from the Square API error
        const errorJson = JSON.parse(error.response.text);

        if(isObject(errorJson) && errorJson.errors) {
            let errors = [];
            errorJson.errors.forEach((obj) => {
                errors.push(obj.detail || 'Invalid request');
            })
            throw new Error(errors.join(', '))
        }

        throw new Error('Invalid request');
    }
}



module.exports = {
    PAYMENT_TYPE_CREDIT_CARD,
    PAYMENT_TYPE_PAYPAL,
    setServer,
    getPaymentByAttribute,
    savePayment,
    runPayment,

    // route handlers
    getPaymentsHandler,
    getPaymentHandler,
    shippingPackingSlipHandler,
    purchaseShippingLabelHandler,
    getShippingLabelHandler,
    deleteShippingLabelHandler
}
