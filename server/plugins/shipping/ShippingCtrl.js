const Joi = require('@hapi/joi');
const BaseController = require('../core/BaseController');

const { createCustomsItem } = require('./shippoAPI/customs_items.js');
const { createShipment } = require('./shippoAPI/shipments.js');
const { createParcel } = require('./shippoAPI/parcels.js');
const { validateNewAddress } = require('./shippoAPI/address');


class ShippingCtrl extends BaseController {

    constructor(server) {
        super(server, 'PackageType');
    }


    getSchema() {
        return {
            label: Joi.string().max(100).required(),
            length: Joi.number().precision(2).min(0).required(),
            width: Joi.number().precision(2).min(0).required(),
            height: Joi.number().precision(2).min(0).allow(null),
            weight: Joi.number().precision(2).min(0).allow(null),
            mass_unit: Joi.string().allow('oz').optional(),  // see note #1 below
            distance_unit: Joi.string().length(2).required(),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    /**
     * Route handler for getting a ProductVariation by ID
     *
     * @param {*} request
     * @param {*} h
     */
    getByIdHandler(request, h) {
        return this.modelForgeFetchHandler(
            {
                id: request.query.id,
                tenant_id: this.getTenantId(request)
            },
            null,
            h
        );
    }


    async validateAddress(request, h) {
        try {
            global.logger.info(`REQUEST: ShippingCtrl.validateAddress`, {
                meta: request.payload
            });

            const res = await validateNewAddress(request.payload);

            global.logger.info(`RESPONSE : ShippingCtrl.validateAddress`, {
                meta: res
            });

            return h.apiSuccess(res);
        }
        catch(err) {
            const error = new Error('ERROR VALIDATING SHIPPING ADDRESS: ' + err.message);
            global.logger.error(error);
            global.bugsnag(error);
            throw Boom.badRequest(error);
        }
    }


    async createCustomsItemFromShoppingCart(ShoppingCart) {
        try {
            const cartJson = ShoppingCart.toJSON();
            const numCartItems = Array.isArray(cartJson.cart_items) ? cartJson.cart_items.length : 0;

            if(!numCartItems) {
                global.logger.error("In createCustomsItemFromShoppingCart", cartJson);
                throw new Error('Can not create customs item from Shopping Cart because the cart contains zero items')
            }

            // global.logger.debug('In createCustomsItemFromShoppingCart', {
            //     meta: {
            //         cartJson
            //     }
            // });

            if(cartJson.shipping_countryCodeAlpha2 !== 'US') {
                return await createCustomsItem({
                    description: 'Clothing',
                    quantity: numCartItems,
                    net_weight: cartJson.product_weight_total,
                    value_amount: numCartItems * 10, // total guess here: $10 * number of items?
                    value_currency: 'USD',
                    origin_country: 'US',
                    metadata: `Cart ID ${cartJson.id}`,
                    mass_unit: 'oz'  // see note #1 below
                });
            }
        }
        catch(err) {
            global.logger.error("CREATE PARCEL ERROR", err)
            throw err;
        }
    }


    /**
     * Creates a Shippo "Shipment" object based on the contents of the ShoppingCart.
     *
     * @param {*} ShoppingCart
     */
    async createShipmentFromShoppingCart(ShoppingCart) {
        global.logger.info(`REQUEST: ShippingCtrl.createShipmentFromShoppingCart`, {
            meta: ShoppingCart ? ShoppingCart.toJSON() : null
        });

        let data = {
            async: false
        };

        data.address_to = {
            name: ShoppingCart.get('shipping_fullName'),
            company: ShoppingCart.get('shipping_company'),
            street1: ShoppingCart.get('shipping_streetAddress'),
            // street_no:,
            street2: ShoppingCart.get('shipping_extendedAddress'),
            // street3:
            city: ShoppingCart.get('shipping_city'),
            state: ShoppingCart.get('shipping_state'),
            zip: ShoppingCart.get('shipping_postalCode'),
            country: ShoppingCart.get('shipping_countryCodeAlpha2'),
            // phone: ,
            email: ShoppingCart.get('shipping_email'),
            // is_residential: ,
            validate: false,
            metadata: null
        };

        data.address_from = {
            name: process.env.DOMAIN_NAME,
            company: 'BreadVan',
            street1: process.env.SHIPPING_ADDRESS_FROM_ADDRESS1,
            // street_no:,
            // street2:,
            // street3:
            city: process.env.SHIPPING_ADDRESS_FROM_CITY,
            state: process.env.SHIPPING_ADDRESS_FROM_STATE,
            zip: process.env.SHIPPING_ADDRESS_FROM_ZIP,
            country: process.env.SHIPPING_ADDRESS_FROM_COUNTRY_CODE,
            // phone: ,
            email: process.env.EMAIL_INFO,
            // is_residential: ,
            validate: false,
            metadata: null
        }

        data.parcels = await this.createParcelsFromShoppingCart(ShoppingCart);
        data.customs_declaration = await this.createCustomsItemFromShoppingCart(ShoppingCart);

        const createShipmentResponse = await createShipment(data);

        global.logger.info(`RESPONSE: ShippingCtrl.createShipmentFromShoppingCart`, {
            meta: createShipmentResponse
        });

        return createShipmentResponse
    }


    /**
     * Returns the weight of the cart item * quantity selected.
     *
     * @param {*} cartItem
     */
    getProductWeightFromCartItem(cartItem) {
        global.logger.info(`REQUEST: ShippingCtrl.getProductWeightFromCartItem`, {
            meta: cartItem
        });

        if(isObject(cartItem)) {
            let weight = 0;
            const qty = cartItem.qty || 1;

            switch(cartItem.product.sub_type) {
                // Currently all products have sizes that contain their respective weight,
                // but this probably won't always be the case in the future,
                // which is my I made this a switch statement.
                default:
                    let selectedSize = cartItem.variants.size;
                    cartItem.product.sizes.forEach((obj) => {
                        if(obj.size === selectedSize) {
                            weight = obj.weight_oz * qty;
                        }
                    });
                    break;
            }

            global.logger.info(`RESPONSE: ShippingCtrl.getProductWeightFromCartItem`, {
                meta: { weight }
            });

            return weight;
        }
        else {
            global.logger.error("getProductWeightFromCartItem: Unable to get product weight because given cartItem was not an object", cartItem)
        }
    }


    /**
     * Creates Shippo "Parcel" objects from the various items in a shopping cart
     * This will affect how much money the customer has to pay in shipping.
     * I'm guessing that tweaking this method over time will allow us to save postage
     * fees if we can calculate more accurately
     *
     * @param {*} ShoppingCart
     */
    async createParcelsFromShoppingCart(ShoppingCart) {
        const cartItems = ShoppingCart.related('cart_items');
        const PackageTypeCollection = await getPackageTypesModel().fetchAll();
        const shippingPackageTypes = {};

        global.logger.info(`REQUEST: ShippingCtrl.createParcelsFromShoppingCart`, {
            meta: { cartItems: cartItems ? cartItems.toJSON() : null }
        });

        if(cartItems) {
            let cartItemsJson = cartItems.toJSON();

            if(Array.isArray(cartItemsJson)) {
                cartItemsJson.forEach((cartItem) => {
                    let PackageType = PackageTypeCollection.findWhere({type: cartItem.product.shipping_package_type});

                    if(PackageType) {
                        let id = PackageType.get('id');

                        if(!shippingPackageTypes.hasOwnProperty(id)) {
                            shippingPackageTypes[id] = {
                                packageType: null,
                                totalWeight: 0
                            };
                        }

                        // The total the amount of weight for each package type needed.
                        // The weight includes the product weight plus the weight of the package material itself
                        shippingPackageTypes[id].packageType = PackageType;
                        shippingPackageTypes[id].totalWeight += parseFloat(PackageType.get('weight')) + parseFloat(getProductWeightFromCartItem(cartItem) || 5);
                    }
                });

                // Create a Shippo "Parcel" object for every package type we have collected:
                const promises = [];
                forEach(shippingPackageTypes, async (obj) => {
                    promises.push(
                        createParcel({
                            length: parseFloat(obj.packageType.get('length')),
                            width: parseFloat(obj.packageType.get('width')),
                            height: parseFloat(obj.packageType.get('height')) || 0.75,
                            distance_unit: obj.packageType.get('distance_unit'),
                            weight: obj.totalWeight,
                            mass_unit: 'oz'  // see note #1 below
                        })
                    );
                });

                return Promise.all(promises);
            }
        }
    }

}

module.exports = ShippingCtrl;


/**
 * NOTES:
 *
 * 1) In order to have mass unit consistency with the product weight and the shipping package weight,
 *      I am forcing the 'oz' mass_unit so we can easily calculate the total weight of the package
 *      (product weight + package weight)
 */
