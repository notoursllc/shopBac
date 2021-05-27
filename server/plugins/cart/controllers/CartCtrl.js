const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const isObject = require('lodash.isobject');
const uuidV4 = require('uuid/v4');
const { ObtainTokenRequest } = require('square-connect');
const BaseController = require('../../core/controllers/BaseController');
const ShipEngine = require('../../shipping/shipEngineApi/ShipEngine')

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

            shipping_rate: Joi.alternatives().try(Joi.string().empty(''), Joi.allow(null)),
            sales_tax: Joi.alternatives().try(Joi.number().integer().min(0), Joi.allow(null)),

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








    // async createHandler(request, h) {
    //     try {
    //         global.logger.info(`REQUEST: CartCtrl.createHandler (${this.modelName})`);

    //         request.payload.token = uuidV4();

    //         const ShoppingCart = await this.getModel().create(request.payload);

    //         global.logger.info(`RESPONSE: CartCtrl.createHandler (${this.modelName})`, {
    //             meta: {
    //                 model: ShoppingCart ? ShoppingCart.toJSON() : null
    //             }
    //         });

    //         return h.apiSuccess(ShoppingCart);
    //     }
    //     catch(err) {
    //         global.logger.error(err);
    //         global.bugsnag(err);
    //         throw Boom.badRequest(err);
    //     }
    // }

    // async createModel(request, h) {
    //     try {
    //         global.logger.info(`REQUEST: CartCtrl.createHandler (${this.modelName})`);

    //         request.payload.token = uuidV4();

    //         const ShoppingCart = await this.getModel().create(request.payload);

    //         global.logger.info(`RESPONSE: CartCtrl.createHandler (${this.modelName})`, {
    //             meta: {
    //                 model: ShoppingCart ? ShoppingCart.toJSON() : null
    //             }
    //         });

    //         return h.apiSuccess(ShoppingCart);
    //     }
    //     catch(err) {
    //         global.logger.error(err);
    //         global.bugsnag(err);
    //         throw Boom.badRequest(err);
    //     }
    // }


    /**
     * This is just a helper function to determine if the cart token being sent
     * is for an active cart.
     * Used by functions below to determine if we should continue with other operations,
     * or just quit immediately.
     */
    async getActiveCart(id, tenant_id, fetchOptions) {
        if(!id || !tenant_id) {
            return false;
        }

        const Cart = await this.modelForgeFetch(
            { id, tenant_id },
            fetchOptions
        );

        if(!Cart || Cart.get('closed_at')) {
            return false;
        }

        return Cart;
    }


    async getActiveCartWithAllRelations(id, tenant_id) {
        return this.getActiveCart(
            id,
            tenant_id,
            {
                withRelated: {
                    'cart_items': (query) => {
                        query.orderBy('created_at', 'ASC');
                    },
                    'cart_items.product': null,
                    'cart_items.product_variant': null,
                    'cart_items.product_variant_sku': null
                }
            }
        )
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


    async upsertHandler(request, h) {
        global.logger.info('RESPONSE: CartCtrl.upsertHandler', {
            meta: request.payload
        });

        try {
            const Cart = await super.upsertModel(request.payload);

            const UpdatedCart = await this.getActiveCartWithAllRelations(
                Cart.get('id'),
                this.getTenantIdFromAuth(request)
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
            const Cart = await this.getActiveCartWithAllRelations(
                request.payload.id,
                this.getTenantIdFromAuth(request)
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

            console.log("API PAYLOAD", apiPayload)
            console.log("CUSTOME ITEMS", apiPayload.shipment.customs)

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

            const Cart = await this.getActiveCartWithAllRelations(
                request.payload.id,
                this.getTenantIdFromAuth(request)
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

}


module.exports = CartCtrl;
