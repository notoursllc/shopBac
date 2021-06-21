const isObject = require('lodash.isobject');
const ShipEngineAPI = require('./ShipEngineAPI');


function getCarrierIds() {
    // return [
    //     // 'se-168142', // fedex
    //     'se-164967' // usps
    // ]
    const ids = process.env.SHIPENGINE_CARRIER_IDS;
    return ids.split(',');
}


function isInternationalShipment(Cart) {
    return Cart.get('shipping_countryCodeAlpha2') !== process.env.SHIPPING_ADDRESS_FROM_COUNTRY_CODE
}


function getServiceCodesForCart(Cart) {
    return isInternationalShipment(Cart)
        ? ['usps_priority_mail_international']
        : ['usps_priority_mail'];

        // fedex comparible: fedex_standard_overnight / fedex_international_economy
}


function bestGuessPackageTypesForCart(Cart) {
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


/**
 * https://www.shipengine.com/international-shipping/
 *
 * @param {*} Cart
 * @returns
 */
function getCustomsConfig(Cart) {
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


async function getShippingRatesForCart(Cart) {
    try {
        const apiPayload = {
            rate_options: {
                carrier_ids: getCarrierIds(),
                service_codes: getServiceCodesForCart(Cart),
                package_types: bestGuessPackageTypesForCart(Cart),
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

        if(isInternationalShipment(Cart)) {
            apiPayload.shipment.customs = getCustomsConfig(Cart)
        }

        // API call to get ShipEngine rates
        const { rate_response } = await ShipEngineAPI.getRates(apiPayload);
        const rates = {};

        // TODO: add logic that will not add to the rates obj
        // if the entry's shipping_amount is greater than the shipping_amount of a faster entry
        // - ignore rate if delivery_days/estimated_deleivery_date is null
        if(isObject(rate_response) && Array.isArray(rate_response.rates)) {
            rate_response.rates.forEach((obj) => {
                if(!rates.hasOwnProperty(obj.delivery_days)) {
                    rates[obj.delivery_days] = obj;
                }
                else {
                    if(rates[obj.delivery_days].shipping_amount.amount > obj.shipping_amount.amount) {
                        rates[obj.delivery_days] = obj;
                    }
                }
            });

            console.log("RATES", rate_response.rates);
            console.log("INVALID RATES", rate_response.invalid_rates);
        }

        return Object.values(rates);
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw err;
    }
}


module.exports = {
    getShippingRatesForCart
};
