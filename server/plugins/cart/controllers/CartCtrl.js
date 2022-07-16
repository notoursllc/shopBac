const Joi = require('joi');
const Boom = require('@hapi/boom');
const isObject = require('lodash.isobject');
const BaseController = require('../../core/controllers/BaseController');
const PackageTypeCtrl = require('../../package-types/controllers/PackageTypeCtrl');
const StripeCtrl = require('./StripeCtrl');
const PayPalCtrl = require('./PayPalCtrl');
const TaxNexusCtrl = require('../../tax-nexus/controllers/TaxNexusCtrl');

// third party APIs
const { emailPurchaseReceiptToBuyer,  emailPurchaseAlertToAdmin, getPurchaseDescription } = require('../services/PostmarkService');
const ShipEngineCtrl = require('../controllers/ShipEngineCtrl');


function getJoiStringOrNull(strLen) {
    return Joi.alternatives().try(Joi.string().trim().max(strLen || 100), Joi.allow(null));
}

class CartCtrl extends BaseController {

    constructor(server) {
        super(server, 'Cart');
        this.PackageTypeCtrl = new PackageTypeCtrl(server);
        this.StripeCtrl = new StripeCtrl(server);
        this.PayPalCtrl = new PayPalCtrl(server);
        this.TaxNexusCtrl = new TaxNexusCtrl(server);
        this.ShipEngineCtrl = new ShipEngineCtrl(server);
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
            selected_shipping_rate: Joi.alternatives().try(Joi.string().empty(''), Joi.allow(null)),
            shipping_rate_quote: Joi.alternatives().try(Joi.string().empty(''), Joi.allow(null)),
            shipping_label_id: getJoiStringOrNull(),
            tax_nexus_applied: Joi.alternatives().try(Joi.string().empty(''), Joi.allow(null)),
            stripe_payment_intent_id: getJoiStringOrNull(),
            stripe_order_id: getJoiStringOrNull(),
            paypal_order_id: getJoiStringOrNull(),
            sales_tax: Joi.alternatives().try(
                Joi.number().integer().min(0),
                Joi.allow(null)
            ),
            is_gift: Joi.boolean(),

            created_at: Joi.date(),
            updated_at: Joi.date(),
            deleted_at: Joi.date(),
            closed_at: Joi.date(),
            shipped_at: Joi.date(),
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
                qb.where('id', '=', id);
                qb.where('tenant_id', '=', tenant_id);
            })
            .fetch(fetchOptions);
    }


    getClosedCart(id, tenant_id, fetchOptions) {
        return this.getModel()
            .query((qb) => {
                qb.where('closed_at', 'is not', null);
                qb.where('id', '=', id);
                qb.where('tenant_id', '=', tenant_id);
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


    fetchAllForTenantHandler(request, h) {
        return super.fetchAllForTenantHandler(
            request,
            h,
            { withRelated: this.getWithRelatedFetchConfig(request.query, this.getAllCartRelations()) }
        );
    }


    fetchOneForTenantHandler(request, h) {
        return super.fetchOneForTenantHandler(
            request,
            h,
            { withRelated: this.getWithRelatedFetchConfig(request.query, this.getAllCartRelations()) }
        );
    }


    upsertCart(data) {
        return this.upsertModel({
            ...data
        });
    }


    async getOrCreateCart(id, tenant_id, fetchOptions) {
        const Cart = await this.getActiveCart(id, tenant_id, fetchOptions);

        if(!Cart) {
            // create
            return this.upsertCart({
                tenant_id
            });
        }

        return Cart;
    }


    getMaskedCart(Cart) {
        if(!Cart) {
            return;
        }

        // mask plugin:
        // https://github.com/seegno/bookshelf-mask
        return Cart.mask(`*,cart_items(id,qty,product(*),product_variant(id,currency,images,label,swatches),product_variant_sku(id,label,display_price,base_price,is_on_sale,sale_price,sku))`)
    }


    // async getByIdHandler(request, h) {
    //     global.logger.info('REQUEST: CartCtrl.getByIdHandler', {
    //         meta: request.query
    //     });

    //     const Cart = await this.getModel()
    //         .query((qb) => {
    //             qb.where('id', '=', request.query.id);
    //             qb.andWhere('tenant_id', '=', this.getTenantIdFromAuth(request));
    //         })
    //         .fetch(
    //             { withRelated: request.query.relations ? this.getAllCartRelations() : null }
    //         );

    //     global.logger.info('RESPONSE: CartCtrl.getByIdHandler', {
    //         meta: null
    //     });

    //     return h.apiSuccess(
    //         this.getMaskedCart(Cart)
    //     );
    // }


    async upsertHandler(request, h) {
        global.logger.info('REQUEST: CartCtrl.upsertHandler', {
            meta: request.payload
        });

        try {
            const Cart = await this.upsertCart(request.payload);

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


    /**
     * This is broken out into a separate function because
     * there is a cost for using the ShipEngine address validation
     * service.
     *
     * TODO: how can I modify this handler so it is not abused
     * by the client?  Some kind of throttling should happen
     * so the user can't call the API over and over.
     */
    async setShippingAddressHandler(request, h) {
        global.logger.info('REQUEST: CartCtrl.setShippingAddressHandler', {
            meta: request.payload
        });

        try {
            const tenantId = this.getTenantIdFromAuth(request);

            // Save to a variable and then delete because the entire payload
            // is used to upsert the shipping data, and a DB error will orrur
            // if this 'validate' property exists
            const validate = request.payload.validate;
            delete request.payload.validate;

            let validationResponse;

            if(validate) {
                // convert the cart shipping params names to respective params for ShipEngine
                // NOTE: Address validation is not 100% reliable.
                // Therefore we should only continue with this transaction if
                // the validation response is 'verified'.  Otherwise we should
                // return the validation error/warning back to the user and let
                // them decide how to procede.
                // The comments in this HackerNews article (about Shopify) were enlightening:
                // https://news.ycombinator.com/item?id=32034643
                const response = await this.ShipEngineCtrl.validateAddresses(
                    tenantId,
                    [
                        {
                            address_line1: request.payload.shipping_streetAddress,
                            city_locality: request.payload.shipping_city,
                            state_province: request.payload.shipping_state,
                            postal_code: request.payload.shipping_postalCode,
                            country_code: request.payload.shipping_countryCodeAlpha2,
                        }
                    ]
                );

                // Hopefully this never happens
                if(!Array.isArray(response)) {
                    global.logger.error(`CartCtrl.setShippingAddressHandler - the API resposne was expected to be an array but it is of type: ${typeof data}`, {
                        meta: { 'API response': data }
                    });
                    throw Boom.badRequest();
                }

                // we only submitted one address so we only care about the first response:
                validationResponse = response[0];

                // Return here is there is a validation error
                // https://www.shipengine.com/docs/addresses/validation/#address-status-meanings
                if(validationResponse.status !== 'verified') {
                    return h.apiSuccess({
                        validation_response: validationResponse,
                        cart: null
                    });
                }
            }

            // Persisting the shipping address in the cart now
            // because createStripeOrderForCart() needs the cart to have shipping address data
            let Cart = await this.upsertCart(request.payload);

            // Create an "Order" in stripe so the tax amount can be set
            const stripeOrder = await this.createStripeOrderForCart(tenantId, Cart.get('id'));

            global.logger.info('STRIPE ORDER', {
                meta: stripeOrder
            });

            if(!stripeOrder) {
                throw new Error('Stripe Order returned null');
            }

            Cart = await this.upsertCart({
                id: Cart.get('id'),
                stripe_order_id: stripeOrder.id,
                sales_tax: stripeOrder.total_details.amount_tax
            });

            // const TaxNexus = await this.TaxNexusCtrl.getModel()
            //     .query((qb) => {
            //         qb.where('tenant_id', '=', tenantId);
            //         qb.andWhere('countryCodeAlpha2', '=', request.payload.shipping_countryCodeAlpha2);
            //         qb.andWhere('state', '=', request.payload.shipping_state);
            //     })
            //     .fetch();

            // const Cart = await this.upsertCart({
            //     ...request.payload,
            //     tax_nexus_applied: TaxNexus ? TaxNexus.toJSON() : null
            // });

            const UpdatedCart = await this.getActiveCart(
                Cart.get('id'),
                tenantId,
                { withRelated: this.getAllCartRelations() }
            );

            return h.apiSuccess({
                validation_response: validationResponse,
                cart: UpdatedCart.toJSON()
            });
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    saveShippingRateQuote(Cart, rates, packingResults) {
        global.logger.info('REQUEST: CartCtrl.saveShippingRateQuote', {
            meta: {
                cart: Cart.toJSON(),
                rates,
                packingResults
            }
        });

        return Cart.save({
            shipping_rate_quote: {
                rates: rates,
                packingResults: packingResults
            }
        });
    }


    async shippingRateEstimateHandler(request, h) {
        global.logger.info('REQUEST: CartCtrl.shippingRateEstimateHandler', {
            meta: request.payload
        });

        try {
            const tenantId = this.getTenantIdFromAuth(request);

            const res = await Promise.all([
                this.getActiveCart(
                    request.payload.id,
                    tenantId,
                    { withRelated: this.getAllCartRelations() }
                ),

                this.PackageTypeCtrl.getModel()
                    .query((qb) => {
                        qb.where('published', '=', true);

                        if(tenantId) {
                            qb.andWhere('tenant_id', '=', tenantId);
                        }
                    })
                    .orderBy('ordinal', 'ASC')
                    .fetchAll()
            ]);

            let Cart = res[0];
            const PackageTypes = res[1];

            if(!Cart) {
                throw new Error("Cart not found")
            }

            const { rates, packingResults } = await this.ShipEngineCtrl.getShippingRatesForCart(
                tenantId,
                Cart.toJSON(),
                PackageTypes.toJSON()
            );

            // console.log("PACKING RESULTS", packingResults)
            // packingResults.packed.forEach((obj) => {
            //     console.log("PACING RES", obj)
            // })
            // console.log("PACKAGE TYPES", PackageTypes.toJSON())

            // in it's own try/catch so any failure saving the rate quote
            // won't affect this operation
            try {
                await this.saveShippingRateQuote(Cart, rates, packingResults);
            }
            catch(err) {
                global.logger.error(err);
                global.bugsnag(err);
            }

            // No shipping rates returned means something is not right.
            // For example, we do not have any packages defined that fit the given product,
            // or the user did not specify a shipping address
            // or the product did not have a weight defined
            if(!rates.length) {
                global.logger.warn('RESPONSE: CartCtrl.shippingRateEstimateHandler - NO SHIPPING RATES WERE RETURNED', {
                    meta: {
                        rates,
                        cart: Cart.toJSON()
                    }
                });
            }
            else {
                global.logger.info('RESPONSE: CartCtrl.shippingRateEstimateHandler', {
                    meta: {
                        rates
                    }
                });
            }

            return h.apiSuccess(rates);
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

            const tenantId = this.getTenantIdFromAuth(request);
            const data = await this.ShipEngineCtrl.getRate(tenantId, request.payload.rate_id);

            if(!data) {
                throw new Error('A shipping rate for the given ID was not found')
            }

            const Cart = await this.getActiveCart(
                request.payload.id,
                tenantId,
                { withRelated: this.getAllCartRelations() }
            );

            const UpdatedCart = await Cart.save({
                selected_shipping_rate: data
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
     * Buys a shipping label from ShipEngine
     *
     * @param {*} request
     * @param {*} h
     * @returns {*} shipping label
     */
    async buyShippingLabelForCartHandler(request, h) {
        try {
            global.logger.info('REQUEST: CartCtrl.buyShippingLabelHandler', {
                meta: request.query
            });

            const tenantId = this.getTenantIdFromAuth(request);

            const Cart = await this.getModel()
                .query((qb) => {
                    qb.andWhere('id', '=', request.payload.id);
                    qb.andWhere('tenant_id', '=', tenantId);
                })
                .fetch();

            if(!Cart) {
                throw new Error(`Cart (${request.payload.id}} could not be found`);
            }

            const selectedRate = Cart.get('selected_shipping_rate');

            if(!selectedRate || !selectedRate.rate_id) {
                throw new Error(
                    `An error occurred when creating a shipping label for Cart ${request.payload.id}. Cart does not have a selected shipping rate value.`
                );
            }

            const data = await this.ShipEngineCtrl.buyShippingLabel(tenantId, selectedRate.rate_id);

            if(!data) {
                throw new Error(`An error occurred when creating a shipping label for Rate ${request.payload.rate_id}`);
            }

            if(Array.isArray(data.errors)) {
                global.logger.error('Errors occurred when buying a label from ShipEngine', {
                    meta: {
                        errors: data.errors
                    }
                });

                const errorMessages = data.errors.map(obj => obj.message);
                throw new Error(errorMessages.join('/n'))
            }

            await Cart.save({
                shipping_label_id: data.label_id || null
            });

            global.logger.info('RESPONSE: CartCtrl.buyShippingLabelHandler', {
                meta: data
            });

            return h.apiSuccess(data);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    /**
     * Gets an order (a closed cart) and the related ShipEngine label data
     *
     * @param {*} request
     * @param {*} h
     * @returns {}
     */
    async getOrderHandler(request, h) {
        try {
            global.logger.info('REQUEST: CartCtrl.getOrderHandler', {
                meta: request.query
            });

            const tenantId = this.getTenantIdFromAuth(request);

            const Cart = await this.getClosedCart(
                request.query.id,
                tenantId,
                { withRelated: this.getAllCartRelations() }
            );

            if(!Cart) {
                throw new Error('Cart not found')
            }

            let label = null;
            if(Cart.get('shipping_label_id')) {
                label = await this.ShipEngineCtrl.getShippingLabel(tenantId, Cart.get('shipping_label_id'));
            }

            const paymentData = await this.getPayment(
                Cart,
                tenantId
            )

            return h.apiSuccess({
                cart: Cart.toJSON(),
                label: label,
                payment: paymentData
            });
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    /**
     * Clears the selected_shipping_rate value from the cart.
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
                selected_shipping_rate: null,
                shipping_rate_quote: null
            });
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
        }
    }


    async createStripeOrderForCart(tenantId, cartId) {
        const Cart = await this.getActiveCart(
            cartId,
            tenantId,
            { withRelated: this.getAllCartRelations() }
        );

        if(!Cart) {
            throw new Error('Cart not found');
        }

        const stripe = await this.StripeCtrl.getStripe(tenantId);
        const c = Cart.toJSON();

        const createConfig = {
            currency: c.currency || 'usd',

            // https://stripe.com/docs/api/orders_v2/create#create_order_v2-line_items
            line_items: c.cart_items.map((item) => {
                // Note: the Stripe "Price" has the product data included in it,
                // so there's no need to specify the 'product' in the API request.
                // In fact, only one 'price' or 'product' argument can be sent but not both
                return {
                    price: item.product_variant_sku.stripe_price_id,
                    quantity: item.qty
                }
            }),

            payment: {
                settings: {
                    payment_method_types: ['card']
                }
            },

            automatic_tax: {
                enabled: true
            },

            // https://stripe.com/docs/api/orders_v2/create#create_order_v2-shipping_details
            shipping_details: {
                // name: `${c.shipping_firstName} ${c.shipping_lastName}`.trim(),
                name: c.shipping_fullName,
                address: {
                    city: c.shipping_city,
                    country: c.shipping_countryCodeAlpha2,
                    line1: c.shipping_streetAddress,
                    line2: c.shipping_extendedAddress,
                    postal_code: c.shipping_postalCode,
                    state: c.shipping_state
                }
            },

            // https://stripe.com/docs/api/orders_v2/create#create_order_v2-billing_details
            // This helps with "Risk Insights"
            billing_details: {
                address: {
                    city: c.billing_address.city,
                    country: c.billing_address.countryCodeAlpha2,
                    line1: c.billing_address.streetAddress,
                    line2: c.billing_address.extendedAddress,
                    postal_code: c.billing_address.postalCode,
                    state: c.billing_address.state
                },
                email: c.shipping_email,
                name: c.billing_fullName,
                phone: c.billing_same_as_shipping ? c.shipping_phone : c.billing_phone
            },

            expand: ['line_items']
        };

        global.logger.info('REQUEST: CartCtrl.createStripeOrderForCart', {
            meta: {
                createConfig,
                cart: c
            }
        });

        return stripe.orders.create(createConfig);
    }


    /**
     * Submits the Stripe order
     * https://stripe.com/docs/orders-beta/tax?html-or-react=html#submit-order
     *
     * @param {*} tenantId
     * @param {*} stripeOrder
     * @returns
     */
     async submitStripeOrderForCart(tenantId, cartId) {
        global.logger.info('REQUEST: CartCtrl.submitStripeOrderForCart', {
            meta: { cartId }
        });

        const Cart = await this.getActiveCart(
            cartId,
            tenantId,
            { withRelated: this.getAllCartRelations() }
        );

        if(!Cart) {
            throw new Error('Cart not found');
        }

        const stripe = await this.StripeCtrl.getStripe(tenantId);

        const resource = stripe.StripeResource.extend({
            request: stripe.StripeResource.method({
                method: 'POST',
                path: `orders/${Cart.get('stripe_order_id')}/submit`
            })
        });

        const stripeArgs = {
            expected_total: Cart.get('grand_total'),
            expand: ['payment.payment_intent']
        };

        // Logging this so I can see the 'expected_total' arg being passed to Stripe
        // because sometimes I get this error:
        // "The `expected_total` you passed does not match the order's current `amount_total`. This probably means something else concurrently modified the order."
        global.logger.info('REQUEST: CartCtrl.submitStripeOrderForCart - stripe args', {
            meta: stripeArgs
        });

        return new resource(stripe).request(stripeArgs);
    }


    async submitStripeOrderForCartHandler(request, h) {
        try {
            global.logger.info('REQUEST: CartCtrl.submitStripeOrderForCartHandler', {
                meta: request.payload
            });

            const tenantId = this.getTenantIdFromAuth(request);
            const submittedOrder = await this.submitStripeOrderForCart(tenantId, request.payload.id)

            global.logger.info('RESPONSE: CartCtrl.submitStripeOrderForCartHandler - Stripe resposne', {
                meta: {
                    submittedOrder
                }
            });

            return h.apiSuccess({
                clientSecret: submittedOrder.payment.payment_intent.client_secret
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
            await this.upsertCart({
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
            const Cart = await this.getClosedCart(
                cartId,
                tenantId,
                { withRelated: this.getAllCartRelations() }
            );

            const Tenant = await this.getTenant(tenantId);
            const orderTitle = getPurchaseDescription(Cart);

            // Although it's probably not necessary to wait for these to
            // complete before returning, using async/await will cause
            // errors to be caught by the catch block.
            await Promise.all([
                emailPurchaseReceiptToBuyer(Cart, Tenant, orderTitle),
                emailPurchaseAlertToAdmin(Cart, orderTitle)
            ]);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
        }

        global.logger.info('RESPONSE: CartCtrl.onPaymentSuccess', {
            meta: {}
        });
    }


    async resendOrderConfirmaionHandler(request, h) {
        try {
            global.logger.info('REQUEST: CartCtrl.resendOrderConfirmaionHandler', {
                meta: request.payload
            });

            const Cart = await this.getClosedCart(
                request.payload.id,
                request.payload.tenant_id,
                { withRelated: this.getAllCartRelations() }
            );

            const Tenant = await this.getTenant(request.payload.tenant_id);
            const orderTitle = getPurchaseDescription(Cart);

            const response = await emailPurchaseReceiptToBuyer(Cart, Tenant, orderTitle);

            global.logger.info('RESPONSE: CartCtrl.resendOrderConfirmaionHandler', {
                meta: {
                    response
                }
            });

            return h.apiSuccess(response);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
        }
    }


    async paymentSuccessHandler(request, h) {
        await this.onPaymentSuccess(
            request.payload.id,
            this.getTenantIdFromAuth(request),
            request.payload
        );

        return h.apiSuccess();
    }


    async getPayment(Cart, tenantId) {
        global.logger.info('REQUEST: CartCtrl.getPayment', {
            meta: {
                cart: Cart.get('id'),
                tenantId
            }
        });

        const stripe = await this.StripeCtrl.getStripe(tenantId);

        // Homoginizing the API response so it's the same
        // wether the payment was processed via Stripe or Paypal
        const paymentData = {
            amount: null,
            currency: null,
            payment_method_details: {}
        }

        // Stripe
        if(Cart.get('stripe_payment_intent_id')) {
            const stripePaymentIntent = await stripe.paymentIntents.retrieve(Cart.get('stripe_payment_intent_id'));

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
            const paypalData = await this.PayPalCtrl.getOrder(
                Cart.get('paypal_order_id'),
                tenantId
            );

            // global.logger.info('PAYPAL ORDER"', {
            //     meta: paypalData
            // });

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

        global.logger.info('RESPONSE: CartCtrl.getPayment', {
            meta: {
                paymentData
            }
        });

        return paymentData;
    }


    async getPaymentHandler(request, h) {
        try {
            const Cart = await this.fetchOneForTenant(request);

            if(!Cart) {
                throw new Error('Cart does not exist');
            }

            const paymentData = await this.getPayment(
                Cart,
                this.getTenantIdFromAuth(request)
            )

            return h.apiSuccess(paymentData);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    /**
     * Sets or unsets the 'shipped_at' value for a closed cart
     *
     * @param {*} request
     * @param {*} h
     * @returns Cart
     */
    async cartShippedHandler(request, h) {
        try {
            global.logger.info('REQUEST: CartCtrl.cartShippedHandler', {
                meta: request.payload
            });

            // You should only be allowed so set the 'shipped_at' value of a closed cart
            const Cart = await this.getClosedCart(
                request.payload.id,
                this.getTenantIdFromAuth(request)
            );

            if(!Cart) {
                throw new Error('Cart not found');
            }

            const UpdatedCart = await Cart.save({
                shipped_at: request.payload.shipped ? new Date() : null
            });

            const updatedCartJson = UpdatedCart.toJSON();

            global.logger.info('RESPONSE: CartCtrl.cartShippedHandler', {
                meta: {
                    updatedCart: updatedCartJson
                }
            });

            return h.apiSuccess(updatedCartJson);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
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



    // async getPageHandler(request, h) {
    //     const Models = await this.getPage(
    //         request,
    //         request.query.viewAllRelated ? this.getAllCartRelations() : null
    //     );
    //     const pagination = Models ? Models.pagination : null;

    //     return h.apiSuccess(
    //         Models.serialize(
    //             // override the 'hidden' prop in the Cart model so everything is returned
    //             // if the auth strategy is 'session'
    //             this.isAuthStrategy_session(request) ? { hidden: [] } : null
    //         ),
    //         pagination
    //     );
    // }
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

            const order = await this.PayPalCtrl.createPaymentFromCart(Cart);

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

            const tenantId = this.getTenantIdFromAuth(request);

            const paypalTransaction = await this.PayPalCtrl.executePayment(
                request.payload.token,
                tenantId
            );

            await this.onPaymentSuccess(
                request.payload.id,
                tenantId,
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
