const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const isObject = require('lodash.isobject');
const BaseController = require('../../core/controllers/BaseController');

// third party APIs
const { sendPurchaseEmails } = require('../services/MailgunService');
const ShipEngine = require('../../shipping/shipEngineApi/ShipEngine');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {
    getOrder: getPaypalOrder,
    createPaymentFromCart: createPaypalPaymentFromCart,
    executePayment: executePaypalPayment } = require('../services/PaypalService');



function getJoiStringOrNull(strLen) {
    return Joi.alternatives().try(Joi.string().trim().max(strLen || 100), Joi.allow(null));
}

class CartCtrl extends BaseController {

    constructor(server) {
        super(server, 'Cart');
        this.ShipEngine = new ShipEngine();
    }


    getSchema(isUpdate) {
        const schema = {
            // id: Joi.string().uuid().allow(null),
            tenant_id: Joi.string().uuid(),

            billing_firstName: getJoiStringOrNull(),
            billing_lastName: getJoiStringOrNull(),
            billing_company: getJoiStringOrNull(),
            billing_streetAddress: getJoiStringOrNull(),
            billing_extendedAddress: getJoiStringOrNull(),
            billing_city: getJoiStringOrNull(),
            billing_state: getJoiStringOrNull(),
            billing_postalCode: getJoiStringOrNull(),
            billing_countryCodeAlpha2: getJoiStringOrNull(2),
            billing_phone: getJoiStringOrNull(),
            billing_same_as_shipping: Joi.boolean().default(true),

            shipping_firstName: getJoiStringOrNull(),
            shipping_lastName: getJoiStringOrNull(),
            shipping_company: getJoiStringOrNull(),
            shipping_streetAddress: getJoiStringOrNull(),
            shipping_extendedAddress: getJoiStringOrNull(),
            shipping_city: getJoiStringOrNull(),
            shipping_state: getJoiStringOrNull(),
            shipping_postalCode: getJoiStringOrNull(),
            shipping_countryCodeAlpha2: getJoiStringOrNull(2),
            shipping_phone: getJoiStringOrNull(),
            shipping_email: Joi.alternatives().try(Joi.string().email().max(50).label('Shipping: Email'), Joi.allow(null)),

            currency: Joi.alternatives().try(Joi.string().empty(''), Joi.allow(null)),
            shipping_rate: Joi.alternatives().try(Joi.string().empty(''), Joi.allow(null)),
            sales_tax: Joi.alternatives().try(Joi.number().integer().min(0), Joi.allow(null)),
            stripe_payment_intent_id: getJoiStringOrNull(),
            paypal_order_id: getJoiStringOrNull(),

            created_at: Joi.date(),
            updated_at: Joi.date(),
            deleted_at: Joi.date(),
            closed_at: Joi.date()
        };

        if(isUpdate) {
            schema.id = Joi.string().uuid().required();
        }

        return schema;
    }


    getActiveCart(id, tenant_id, fetchOptions) {
        if(!id || !tenant_id) {
            return false;
        }

        return this.getModel()
            .query((qb) => {
                qb.where('closed_at', 'IS', null);
                qb.andWhere('id', '=', id);
                qb.andWhere('tenant_id', '=', tenant_id);
            })
            .fetch(fetchOptions);
    }


    getAllCartRelations() {
        return {
            'cart_items': (query) => {
                query.orderBy('created_at', 'ASC');
            },
            'cart_items.product': null,
            'cart_items.product_variant': null,
            'cart_items.product_variant_sku': null
        }
    }


    async getOrCreateCart(id, tenant_id, fetchOptions) {
        const Cart = await this.getActiveCart(id, tenant_id, fetchOptions);

        if(!Cart) {
            // create
            return this.upsertModel({
                tenant_id
            });
        }

        return Cart;
    }


    getMaskedCart(Cart) {
        // mask plugin:
        // https://github.com/seegno/bookshelf-mask
        return Cart.mask(`*,cart_items(id,qty,product(id,title,description),product_variant(id,currency,display_price,base_price,is_on_sale,sale_price,images,label,swatches),product_variant_sku(id,label,display_price,base_price,is_on_sale,sale_price,sku))`)
    }


    async getByIdHandler(request, h) {
        global.logger.info('REQUEST: CartCtrl.getByIdHandler', {
            meta: request.query
        });

        const Cart = await this.getModel()
            .query((qb) => {
                qb.where('id', '=', request.query.id);
                qb.andWhere('tenant_id', '=', this.getTenantIdFromAuth(request));
            })
            .fetch(
                { withRelated: request.query.relations ? this.getAllCartRelations() : null }
            );

        global.logger.info('RESPONSE: CartCtrl.getByIdHandler', {
            meta: null
        });

        return h.apiSuccess(
            this.getMaskedCart(Cart)
        );
    }


    async upsertHandler(request, h) {
        global.logger.info('REQUEST: CartCtrl.upsertHandler', {
            meta: request.payload
        });

        try {
            const Cart = await super.upsertModel(request.payload);

            const UpdatedCart = await this.getActiveCart(
                Cart.get('id'),
                this.getTenantIdFromAuth(request),
                { withRelated: this.getAllCartRelations() }
            );

            return h.apiSuccess(
                this.getMaskedCart(UpdatedCart)
            );
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    bestGuessPackageTypesForCart(Cart) {
        const numItems = Cart.get('num_items') || 1;

        if(numItems <= 2) {
            return [
                'flat_rate_envelope', // usps
                // 'fedex_envelope', // fedex
            ];
        }
        if(numItems <= 4) {
            return [
                'small_flat_rate_box' // usps
                // 'fedex_small_box_onerate', // fedex
            ];
        }
        if(numItems <= 6) {
            return [
                'medium_flat_rate_box' // usps
                // 'fedex_medium_box_onerate', // fedex
            ];
        }
        if(numItems <= 8) {
            return [
                'large_flat_rate_box'  // usps
                // 'fedex_large_box_onerate', // fedex
            ];
        }
        return [
            'large_flat_rate_box'  // usps
            // 'fedex_extra_large_box_onerate', // fedex
        ];
    }


    isInternationalShipment(Cart) {
        return Cart.get('shipping_countryCodeAlpha2') !== process.env.SHIPPING_ADDRESS_FROM_COUNTRY_CODE
    }


    getServiceCodesForCart(Cart) {
        return this.isInternationalShipment(Cart)
            ? ['usps_priority_mail_international']
            : ['usps_priority_mail'];

            // fedex comparible: fedex_standard_overnight / fedex_international_economy
    }

    getCarrierIds() {
        return [
            // 'se-168142', // fedex
            'se-164967' // usps
        ]
    }


    /**
     * https://www.shipengine.com/international-shipping/
     *
     * @param {*} Cart
     * @returns
     */
    getCustomsConfig(Cart) {
        const config = {
            contents: 'merchandise',
            non_delivery: 'treat_as_abandoned',
            customs_items: []
        }

        Cart.related('cart_items').forEach((model) => {
            const product = model.related('product');
            const cartItem = {};

            cartItem.harmonized_tariff_code = product.get('customs_harmonized_system_code');
            cartItem.country_of_manufacture = product.get('customs_country_of_origin');
            cartItem.country_of_origin = product.get('customs_country_of_origin');
            cartItem.quantity = model.get('qty');
            cartItem.description = product.get('description');
            cartItem.value = {
                currency: 'usd',
                amount: model.related('product_variant_sku').get('display_price') || model.related('product_variant').get('display_price')
            }

            config.customs_items.push(cartItem);
        });

        return config;
    }


    async shippingRateEstimateHandler(request, h) {
        try {
            const Cart = await this.getActiveCart(
                request.payload.id,
                this.getTenantIdFromAuth(request),
                { withRelated: this.getAllCartRelations() }
            );

            if(!Cart) {
                throw new Error("Cart not found")
            }

            console.log("CART", Cart.toJSON());

            const apiPayload = {
                rate_options: {
                    carrier_ids: this.getCarrierIds(),
                    service_codes: this.getServiceCodesForCart(Cart),
                    package_types: this.bestGuessPackageTypesForCart(Cart),
                    calculate_tax_amount: false,
                    preferred_currency: 'usd'
                },
                shipment: {
                    ship_from: {
                        company_name: process.env.SHIPPING_ADDRESS_FROM_COMPANY,
                        name: "Greg Bruins",
                        phone: process.env.SHIPPING_ADDRESS_FROM_PHONE,
                        address_line1: process.env.SHIPPING_ADDRESS_FROM_ADDRESS1,
                        // address_line2: "Suite 300",
                        city_locality: process.env.SHIPPING_ADDRESS_FROM_CITY,
                        state_province: process.env.SHIPPING_ADDRESS_FROM_STATE,
                        postal_code: process.env.SHIPPING_ADDRESS_FROM_ZIP,
                        country_code: process.env.SHIPPING_ADDRESS_FROM_COUNTRY_CODE,
                        // address_residential_indicator: "no"
                      },
                    ship_to: {
                        name: `${Cart.get('shipping_firstName')} ${Cart.get('shipping_lastName')}`,
                        phone: Cart.get('shipping_phone'),
                        address_line1: Cart.get('shipping_streetAddress'),
                        city_locality: Cart.get('shipping_city'),
                        state_province: Cart.get('shipping_state'),
                        postal_code: Cart.get('shipping_postalCode'),
                        country_code: Cart.get('shipping_countryCodeAlpha2'),
                        // address_residential_indicator: "yes"
                    },
                    packages: [
                        {
                            weight: {
                                value: Cart.get('weight_oz_total'),
                                unit: 'ounce' // pound,ounce
                            }
                        }
                    ]
                }
            };

            if(this.isInternationalShipment(Cart)) {
                apiPayload.shipment.customs = this.getCustomsConfig(Cart)
            }

            // console.log("API PAYLOAD", apiPayload)
            // console.log("CUSTOME ITEMS", apiPayload.shipment.customs)

            const { data } = await this.ShipEngine.$axios.post('rates', apiPayload);

            // test: sort by delivery_days
            const rates = {};

            // TODO: add logic that will not add to the rates obj
            // if the entry's shipping_amount is greater than the shipping_amount of a faster entry
            // - ignore rate if delivery_days/estimated_deleivery_date is null
            if(isObject(data) && isObject(data.rate_response) && Array.isArray(data.rate_response.rates)) {
                data.rate_response.rates.forEach((obj) => {
                    if(!rates.hasOwnProperty(obj.delivery_days)) {
                        rates[obj.delivery_days] = obj;
                    }
                    else {
                        if(rates[obj.delivery_days].shipping_amount.amount > obj.shipping_amount.amount) {
                            rates[obj.delivery_days] = obj;
                        }
                    }
                });

                console.log("RATES", data.rate_response.rates);
                console.log("INVALID RATES", data.rate_response.invalid_rates);
            }

            return h.apiSuccess(
                Object.values(rates)
            );
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async selectShippingRateHandler(request, h) {
        try {
            global.logger.info('REQUEST: CartCtrl.selectShippingRateHandler', {
                meta: request.payload
            });

            const { data } = await this.ShipEngine.$axios.get(`rates/${request.payload.rate_id}`);

            if(!data) {
                throw new Error('A shipping rate for the given ID was not found')
            }

            const Cart = await this.getActiveCart(
                request.payload.id,
                this.getTenantIdFromAuth(request),
                { withRelated: this.getAllCartRelations() }
            );

            const UpdatedCart = await Cart.save({
                shipping_rate: data
            });

            const UpdatedCartJson = UpdatedCart.toJSON();

            global.logger.info('RESPONSE: CartCtrl.selectShippingRateHandler', {
                meta: UpdatedCartJson
            });

            return h.apiSuccess(UpdatedCartJson);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    /**
     * Clears the shipping_rate value from the cart.
     * This should be done whenever a cart item is added/removed from the cart,
     * as the total product weight will have changed.
     *
     * @param String cartId
     * @param String tenantId
     * @returns Promise
     */
     async clearShippingRate(cartId, tenantId) {
        try {
            global.logger.info('REQUEST: CartCtrl.clearShippingRate', {
                meta: {
                    cartId,
                    tenantId
                }
            });

            const Cart = await this.getActiveCart(cartId, tenantId);

            return Cart.save({
                shipping_rate: null
            });
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
        }
    }


    async getStripePaymentIntentHandler(request, h) {
        try {
            global.logger.info('REQUEST: CartCtrl.getStripePaymentIntentHandler', {
                meta: request.payload
            });

            const Cart = await this.getActiveCart(
                request.payload.id,
                this.getTenantIdFromAuth(request),
                { withRelated: this.getAllCartRelations() }
            );

            if(!Cart) {
                throw new Error('Cart not found');
            }

            console.log("CART", Cart.toJSON())

            const paymentIntent = await stripe.paymentIntents.create({
                amount: Cart.get('grand_total'),
                currency: Cart.get('currency') || 'usd',
                payment_method_types: ['card'],
            });

            if(!paymentIntent) {
                throw new Error('PaymentIntent returned null');
            }

            global.logger.info('RESPONSE: CartCtrl.getStripePaymentIntentHandler', {
                meta: {
                    paymentIntent
                }
            });

            return h.apiSuccess({
                clientSecret: paymentIntent.client_secret
            });
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async onPaymentSuccess(cartId, tenantId, cartUpsertData) {
        global.logger.info('REQUEST: CartCtrl.onPaymentSuccess', {
            meta: {
                cartId,
                tenantId,
                cartUpsertData
            }
        });

        try {
            // Update the cart with the supplied data
            // and close close the cart
            await super.upsertModel({
                ...cartUpsertData,
                id: cartId,
                closed_at: new Date()
            });
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
        }

        // NOTE: Any failures that happen after this do not affect the transaction
        // and thus should fail silently (catching and logging errors), as the user has already been changed
        // and we can't give the impression of an overall transaction failure that may prompt them
        // to re-do the purchase.

        try {
            this.decrementInventoryCount(cartId, tenantId);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
        }

        try {
            const Cart = await this.getModel()
                .query((qb) => {
                    qb.where('id', '=', cartId);
                    qb.andWhere('tenant_id', '=', tenantId);
                })
                .fetch(
                    { withRelated: this.getAllCartRelations() }
                );

            const Tenant = await this.server.app.bookshelf.model('Tenant')
                .query((qb) => {
                    qb.where('id', '=', tenantId);
                })
                .fetch();

            sendPurchaseEmails(Cart, Tenant);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
        }

        global.logger.info('RESPONSE: CartCtrl.onPaymentSuccess', {
            meta: {}
        });
    }


    async paymentSuccessHandler(request, h) {
        await this.onPaymentSuccess(
            request.payload.id,
            this.getTenantIdFromAuth(request),
            request.payload
        );

        return h.apiSuccess();
    }


    async getPaymentHandler(request, h) {
        global.logger.info('REQUEST: CartCtrl.getPaymentHandler', {
            meta: request.query
        });

        const Cart = await this.getModel()
            .query((qb) => {
                qb.where('id', '=', request.query.id);
                qb.andWhere('tenant_id', '=', this.getTenantIdFromAuth(request));
            })
            .fetch();

        if(!Cart) {
            throw new Error('Cart does not exist');
        }

        // Homoginizing the API response so it's the same
        // wether the payment was processed via Stripe or Paypal
        const paymentData = {
            amount: null,
            currency: null,
            payment_method_details: {}
        }

        // Stripe
        if(Cart.get('stripe_payment_intent_id')) {
            const stripePaymentIntent = await stripe.paymentIntents.retrieve(
                Cart.get('stripe_payment_intent_id')
            );

/*
// SAMPLE PAYMENT INTENT RESPONSE
{
    "id": "pi_0J3th3lUxEbdEgd3nL7YiqJV",
    "object": "payment_intent",
    "allowed_source_types": [
      "card"
    ],
    "amount": 1939,
    "amount_capturable": 0,
    "amount_received": 1939,
    "application": null,
    "application_fee_amount": null,
    "canceled_at": null,
    "cancellation_reason": null,
    "capture_method": "automatic",
    "charges": {
      "object": "list",
      "count": 1,
      "data": [
        {
          "id": "ch_0J3th4lUxEbdEgd3uHT4t0jL",
          "object": "charge",
          "amount": 1939,
          "amount_captured": 1939,
          "amount_refunded": 0,
          "application": null,
          "application_fee": null,
          "application_fee_amount": null,
          "balance_transaction": "txn_0J3th5lUxEbdEgd3saEkvZuK",
          "billing_details": {
            "address": {
              "city": "burlingame",
              "country": "US",
              "line1": "123 abc st",
              "line2": null,
              "postal_code": "94401",
              "state": "CA"
            },
            "email": null,
            "name": "robert labla",
            "phone": null
          },
          "calculated_statement_descriptor": "Stripe",
          "captured": true,
          "card": null,
          "created": 1624068838,
          "currency": "usd",
          "customer": null,
          "description": null,
          "destination": null,
          "dispute": null,
          "disputed": false,
          "failure_code": null,
          "failure_message": null,
          "fee": 86,
          "fee_details": [
            {
              "amount": 86,
              "amount_refunded": 0,
              "application": null,
              "currency": "usd",
              "description": "Stripe processing fees",
              "type": "stripe_fee"
            }
          ],
          "fraud_details": {},
          "invoice": null,
          "livemode": false,
          "metadata": {},
          "on_behalf_of": null,
          "order": null,
          "outcome": {
            "network_status": "approved_by_network",
            "reason": null,
            "risk_level": "normal",
            "risk_score": 11,
            "seller_message": "Payment complete.",
            "type": "authorized"
          },
          "paid": true,
          "payment_intent": "pi_0J3th3lUxEbdEgd3nL7YiqJV",
          "payment_method": "pm_0J3th4lUxEbdEgd3HXALrCjJ",
          "payment_method_details": {
            "card": {
              "brand": "visa",
              "checks": {
                "address_line1_check": "pass",
                "address_postal_code_check": "pass",
                "cvc_check": "pass"
              },
              "country": "US",
              "exp_month": 11,
              "exp_year": 2022,
              "fingerprint": "Gwiy8I00xFJzKCpN",
              "funding": "credit",
              "installments": null,
              "last4": "4242",
              "network": "visa",
              "three_d_secure": null,
              "wallet": null
            },
            "type": "card"
          },
          "receipt_email": null,
          "receipt_number": null,
          "receipt_url": "https://pay.stripe.com/receipts/lUxEbdEgd3sGdHsGqutxjTJ1DpfibSxo/ch_0J3th4lUxEbdEgd3uHT4t0jL/rcpt_JhIHXX5kT8SQifOjYTSaDHvHhxZEOKN",
          "refunded": false,
          "refunds": [],
          "review": null,
          "shipping": null,
          "source": null,
          "source_transfer": null,
          "statement_description": null,
          "statement_descriptor": null,
          "statement_descriptor_suffix": null,
          "status": "paid",
          "transfer_data": null,
          "transfer_group": null,
          "uncaptured": null
        }
      ],
      "has_more": false,
      "total_count": 1,
      "url": "/v1/charges?payment_intent=pi_0J3th3lUxEbdEgd3nL7YiqJV"
    },
    "client_secret": "pi_0J3th3lUxEbdEgd3nL7YiqJV_secret_3qvHqFK3JdIGoxjc3qwvUpAHt",
    "confirmation_method": "automatic",
    "created": 1624068837,
    "currency": "usd",
    "customer": null,
    "description": null,
    "invoice": null,
    "last_payment_error": null,
    "livemode": false,
    "metadata": {},
    "next_action": null,
    "next_source_action": null,
    "on_behalf_of": null,
    "payment_method": "pm_0J3th4lUxEbdEgd3HXALrCjJ",
    "payment_method_options": {
      "card": {
        "installments": null,
        "network": null,
        "request_three_d_secure": "automatic"
      }
    },
    "payment_method_types": [
      "card"
    ],
    "receipt_email": null,
    "review": null,
    "setup_future_usage": null,
    "shipping": null,
    "source": null,
    "statement_descriptor": null,
    "statement_descriptor_suffix": null,
    "status": "succeeded",
    "transfer_data": null,
    "transfer_group": null
}
*/

            // Not everything needs to be returned to the client.
            // Cherry-picking only the data that seems most appropriate
            if(isObject(stripePaymentIntent)) {
                // The payment intent returns an array of charges,
                // but in our case I think it will never be more than one charge,
                // so im simplifying the response by simply returning data for the
                // first charge.
                const data = stripePaymentIntent.charges.data[0];

                paymentData.amount = data.amount;
                paymentData.currency = data.currency;
                paymentData.payment_method_details = {
                    ...data.payment_method_details
                }

            }
        }
        // Paypal
        else if(Cart.get('paypal_order_id')) {
            const paypalData = await getPaypalOrder(Cart.get('paypal_order_id'));

/*
// SAMPLE PAYPAL ORDER RESPONSE
{
    "statusCode": 200,
    "headers": {
      "cache-control": "max-age=0, no-cache, no-store, must-revalidate",
      "content-length": "1674",
      "content-type": "application/json",
      "date": "Sat, 19 Jun 2021 18:01:47 GMT",
      "paypal-debug-id": "ae7639518e536",
      "connection": "close"
    },
    "result": {
      "id": "67A693631X658172K",
      "intent": "CAPTURE",
      "status": "COMPLETED",
      "purchase_units": [
        {
          "reference_id": "default",
          "amount": {
            "currency_code": "USD",
            "value": "19.39",
            "breakdown": {
              "item_total": {
                "currency_code": "USD",
                "value": "11.00"
              },
              "shipping": {
                "currency_code": "USD",
                "value": "7.40"
              },
              "tax_total": {
                "currency_code": "USD",
                "value": "0.99"
              }
            }
          },
          "payee": {
            "email_address": "gbruins-facilitator@not-ours.com",
            "merchant_id": "FR8YCDM9SB5TJ",
            "display_data": {
              "brand_name": "BreadVan"
            }
          },
          "payments": {
            "captures": [
              {
                "id": "66A01300605931714",
                "status": "COMPLETED",
                "amount": {
                  "currency_code": "USD",
                  "value": "19.39"
                },
                "final_capture": true,
                "seller_protection": {
                  "status": "ELIGIBLE",
                  "dispute_categories": [
                    "ITEM_NOT_RECEIVED",
                    "UNAUTHORIZED_TRANSACTION"
                  ]
                },
                "seller_receivable_breakdown": {
                  "gross_amount": {
                    "currency_code": "USD",
                    "value": "19.39"
                  },
                  "paypal_fee": {
                    "currency_code": "USD",
                    "value": "0.86"
                  },
                  "net_amount": {
                    "currency_code": "USD",
                    "value": "18.53"
                  }
                },
                "links": [
                  {
                    "href": "https://api.sandbox.paypal.com/v2/payments/captures/66A01300605931714",
                    "rel": "self",
                    "method": "GET"
                  },
                  {
                    "href": "https://api.sandbox.paypal.com/v2/payments/captures/66A01300605931714/refund",
                    "rel": "refund",
                    "method": "POST"
                  },
                  {
                    "href": "https://api.sandbox.paypal.com/v2/checkout/orders/67A693631X658172K",
                    "rel": "up",
                    "method": "GET"
                  }
                ],
                "create_time": "2021-06-19T18:01:44Z",
                "update_time": "2021-06-19T18:01:44Z"
              }
            ]
          }
        }
      ],
      "payer": {
        "name": {
          "given_name": "greg",
          "surname": "bruins"
        },
        "email_address": "gbruins2@not-ours.com",
        "payer_id": "84JUWSBRDAB9C",
        "address": {
          "country_code": "US"
        }
      },
      "create_time": "2021-06-19T18:01:14Z",
      "update_time": "2021-06-19T18:01:44Z",
      "links": [
        {
          "href": "https://api.sandbox.paypal.com/v2/checkout/orders/67A693631X658172K",
          "rel": "self",
          "method": "GET"
        }
      ]
    }
}
*/

            if(isObject(paypalData)) {
                // Just like the array of charges in the Stripe response,
                // paypal returns an array of 'purchase_units', which I believe
                // in our case will always be just one:
                const data = paypalData.result.purchase_units[0];

                paymentData.amount = data.amount.value * 100; // convert to cents
                paymentData.currency = data.amount.currency_code ? data.amount.currency_code.toLowerCase() : null;
                paymentData.payment_method_details = {
                    type: 'paypal'
                };

                // this one is unique for paypal transactions:
                paymentData.payer = {
                    email_address: paypalData.result.payer.email_address
                }
            }
        }

        global.logger.info('RESPONSE: CartCtrl.getPaymentHandler', {
            meta: {
                paymentData
            }
        });

        return h.apiSuccess(paymentData);
    }


    async decrementInventoryCount(cartId, tenantId) {
        try {
            global.logger.info(`REQUEST: CartCtrl.decrementInventoryCount`, {
                meta: {
                    cart_id: cartId
                }
            });

            const Cart = await this.getModel()
                .query((qb) => {
                    qb.where('id', '=', cartId);
                    qb.andWhere('tenant_id', '=', tenantId);
                })
                .fetch(
                    { withRelated: {
                        'cart_items': (query) => {
                            query.orderBy('created_at', 'ASC');
                        },
                        'cart_items.product_variant_sku': null
                    } }
                );

            const promises = [];

            Cart.related('cart_items').forEach(async (CartItem) => {
                const ProductVariantSku = CartItem.related('product_variant_sku');

                if(ProductVariantSku) {
                    let newInventoryCount = ProductVariantSku.get('inventory_count') - CartItem.get('qty');
                    if(newInventoryCount < 0) {
                        newInventoryCount = 0;
                    }

                    promises.push(
                        this.server.app.bookshelf.model('ProductVariantSku').update(
                            { inventory_count: newInventoryCount },
                            { id: ProductVariantSku.get('id') }
                        )
                    );
                }
            });

            await Promise.all(promises);

            global.logger.info(`RESPONSE: ProductVariantSkuCtrl.decrementInventoryCount`, {
                meta: {}
            });
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw err;
        }
    }



    /*******************
     * PAYPAL related
     ********************/

     async createPaypalPaymentHandler(request, h) {
        try {
            global.logger.info('REQUEST: PaypalCartCtrl:createPaymentHandler', {
                meta: request.payload
            });

            const Cart = await this.getActiveCart(
                request.payload.id,
                this.getTenantIdFromAuth(request),
                { withRelated: this.getAllCartRelations() }
            );

            const order = await createPaypalPaymentFromCart(Cart);

            global.logger.info('RESPONSE: PaypalCartCtrl:createPaymentHandler', {
                meta: {
                    paymentToken: order.result.id
                }
            });

            return h.apiSuccess({
                paymentToken: order.result.id
            });
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badData(err);
        }
    }


    async executePaypalPaymentHandler(request, h) {
        try {
            global.logger.info('REQUEST: PaypalCartCtrl:executePaymentHandler', {
                meta: request.payload
            });

            const paypalTransaction = await executePaypalPayment(request.payload.token)
            console.log("PAYPAL TRANSACTION", paypalTransaction)

            await this.onPaymentSuccess(
                request.payload.id,
                this.getTenantIdFromAuth(request),
                {
                    paypal_order_id: paypalTransaction.result.id
                }
            );

            global.logger.info('RESPONSE: PaypalCartCtrl:executePaymentHandler', {
                meta: {}
            });

            return h.apiSuccess();
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badData(err);
        }
    }

}


module.exports = CartCtrl;
