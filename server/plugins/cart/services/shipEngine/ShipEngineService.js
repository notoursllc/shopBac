const isObject = require('lodash.isobject');
const ShipEngineAPI = require('./ShipEngineAPI');
const PackageService = require('../../../package-types/services/PackageService')


function getEnvCarriers() {
    try {
        return JSON.parse(process.env.SHIPENGINE_CARRIERS);
    }
    catch(err) {
        global.logger.error("ERROR GETTING SHIPENGINE_CARRIERS FROM ENVIRONMENT VARIABLE", {
            meta: {
                error: err
            }
        });
        return [];
    }
}

function getCarrierIds() {
    return getEnvCarriers().map((obj) => obj.id);
}


function isDomesticShipment(cart) {
    if(isObject(cart)
        && cart.shipping_countryCodeAlpha2
        && cart.shipping_countryCodeAlpha2 !== process.env.SHIPPING_ADDRESS_FROM_COUNTRY_CODE) {
        return false;
    }

    return true;
//     if(
//         !isObject(cart)
//         || !cart.hasOwnProperty('shipping_countryCodeAlpha2')
//         || !cart.shipping_countryCodeAlpha2
//         || (isObject(cart) && cart.shipping_countryCodeAlpha2 === process.env.SHIPPING_ADDRESS_FROM_COUNTRY_CODE)) {
//         return true;
//     }

//     return false;
}


function getServiceCodesForCart(cart) {
    const isDomestic = isDomesticShipment(cart);

    return getEnvCarriers().map((obj) => {
        return obj.service_codes[isDomestic ? 'domestic' : 'international']
    });

    // fedex comparible: fedex_standard_overnight / fedex_international_economy
}


function getProductArrayFromCart(cartJson) {
    if(!isObject(cartJson)) {
        return;
    }

    const products = [];

    cartJson.cart_items.forEach((cartItem) => {
        for(let i=0; i<cartItem.qty; i++) {

            // need to stuff the product_variant and product_variant_sku into the
            // product object so all of the data related to the object is included in
            // the packing results.  Need SKU info in order to fulfill the order... without
            // the sku we wouldn't know what to pack in the box when fulfilling orders.
            products.push({
                ...cartItem.product,
                product_variant: cartItem.product_variant,
                product_variant_sku: cartItem.product_variant_sku
            });
        }
    });

    return products;
}


function getProductWeight(productId, cart) {
    let weight = 0;

    if(Array.isArray(cart.cart_items)) {
        cart.cart_items.forEach((obj) => {
            if(obj.product.id === productId) {
                const variantSkuWeight = isObject(obj.product_variant_sku) ? parseFloat(obj.product_variant_sku.weight_oz || 0) : 0;

                if(variantSkuWeight) {
                    weight = variantSkuWeight;
                }
            }
        })
    }

    return weight;
}


/**
 * https://www.shipengine.com/international-shipping/
 *
 * @param {*} cart
 * @returns
 */
 function getCustomsConfig(cart) {
    const config = {
        contents: 'merchandise',
        non_delivery: 'treat_as_abandoned',
        customs_items: []
    }

    if(Array.isArray(cart.cart_items)) {
        cart.cart_items.forEach((obj) => {
            config.customs_items.push({
                quantity: obj.qty,
                description: obj.product.description,
                harmonized_tariff_code: obj.product.customs_harmonized_system_code,
                country_of_manufacture: obj.product.customs_country_of_origin,
                country_of_origin: obj.product.customs_country_of_origin,

                value: {
                    currency: 'usd',
                    amount: obj.product_variant_sku.display_price
                }
            });
        });
    }

    return config;
}


function getApiPackageTypes(cart, packageTypes) {
    const package_types = [];

    // if any of the DB packageTypes have a specific value defined, then add it:
    packageTypes.forEach((type) => {
        if(type.code_for_carrier && !package_types.includes(type.code_for_carrier)) {
            package_types.push(type.code_for_carrier);
        }
    });

    // USPS has a more generic type called "package",
    // which seems like a good thing to add as a fallback.
    // (This may change though as I learn more about shipping)
    // NOTE: currently, I am only using USPS, so this will always be true.  Future proofing though
    // in case I use fedex someday
    const service_codes = getServiceCodesForCart(cart);
    if(
        (service_codes.includes('usps_priority_mail') || service_codes.includes('usps_priority_mail_international'))
        && !package_types.includes('package')
    ) {
        package_types.push('package');
    }

    return package_types;
}


/**
 * Builds the API request payload for ShipEngineAPI.getRates()
 *
 * Separating out this method from getShippingRatesForCart
 * so it can be unit tested.  It's important that the API
 * request payload is correct.
 *
 * @param {*} cart
 */
function getRatesApiPayload(cart, packageTypes) {
    try {
        const apiPayload = {
            rate_options: {
                carrier_ids: getCarrierIds(),
                service_codes: getServiceCodesForCart(cart),
                // package_types: getApiPackageTypes(cart, packageTypes),
                calculate_tax_amount: false,
                preferred_currency: 'usd'
            },
            shipment: {
                ship_from: {
                    company_name: process.env.SHIPPING_ADDRESS_FROM_COMPANY,
                    name: process.env.SHIPPING_ADDRESS_FROM_NAME,
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
                    name: `${cart.shipping_firstName} ${cart.shipping_lastName}`,
                    phone: cart.shipping_phone,
                    address_line1: cart.shipping_streetAddress,
                    city_locality: cart.shipping_city,
                    state_province: cart.shipping_state,
                    postal_code: cart.shipping_postalCode,
                    country_code: cart.shipping_countryCodeAlpha2,
                    // address_residential_indicator: "yes"
                },
                packages: [] // this will be constructed below
            }
        };

        const packingResults = PackageService.packProducts(
            getProductArrayFromCart(cart),
            packageTypes
        );

        // console.log("PACKING RESULTS", packingResults)
        // console.log("PACKING PACKED", packingResults.packed);
        // console.log("PACKING PACKED[0] BOX", packingResults.packed[0].box);

        // Collecting the array of boxes (package_types) so I can determine
        // the apiPayload.rate_options.package_types value.  Sending specific
        // package_types in the API request will give the most accurate rates.
        //
        // NOTE that there is a scenario where packingResults.packed is an empty array.
        // This would occur if none of the packageTypes passed into getRatesApiPayload()
        // was a fit for the producs(s). If this were to occur then of course
        // apiPayload.shipment.packages would remain empty, and calling
        // ShipEngineAPI.getRates(apiPayload) would not return any rates.
        const packedBoxes = packingResults.packed.map((obj) => {
            if(isObject(obj) && isObject(obj.box)) {
                return obj.box;
            }
        });
        apiPayload.rate_options.package_types = getApiPackageTypes(cart, packedBoxes)

        // build the 'apiPayload.shipment.packages' API argument
        packingResults.packed.forEach((obj) => {
            const apiPackage = {
                weight: {
                    value: typeof obj.box.weight_oz === 'number' ? obj.box.weight_oz : 0, // the weight of the box itself
                    unit: 'ounce' // pound,ounce
                },
                dimensions: {
                    length: obj.box.length_cm,
                    width: obj.box.width_cm,
                    height: obj.box.height_cm,
                    unit: 'centimeter' // inch,centimeter: https://www.shipengine.com/docs/shipping/size-and-weight/#dimensions
                }
            }

            // The initial value of apiPackage.weight.value is simply the
            // weight of the box itself (if specified).
            // Now we add to that value the combined weight of all products in the box:
            if(Array.isArray(obj.products)) {
                obj.products.forEach((prod) => {
                    apiPackage.weight.value += getProductWeight(prod.id, cart);
                });
            }

            apiPayload.shipment.packages.push(apiPackage);
        });

        if(!isDomesticShipment(cart)) {
            apiPayload.shipment.customs = getCustomsConfig(cart)
        }

        return {
            apiArgs: apiPayload,
            packingResults: packingResults
        }
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw err;
    }
}


async function getShippingRatesForCart(cart, packageTypes) {
    try {
        // API call to get ShipEngine rates
        const { apiArgs, packingResults } = getRatesApiPayload(cart, packageTypes);
        // console.log("getShippingRatesForCart: API ARGS", apiArgs)
        // console.log("getShippingRatesForCart: API ARGS PACKAGES", apiArgs.shipment.packages)

        // If the apiArgs.shipment.packages is an empth array
        // then no rates will be returned by ShipEngineAPI.getRates()
        // understandably, since it has ship_from and ship_to but no
        // idea of what the packages are.
        // I don't think it's the responsibility of this method to
        // determine how to handle this scenario.
        if(!apiArgs.shipment.packages.length) {
            global.logger.warn('ShipEngineService.getShippingRatesForCart - API PAYLOAD DOES NOT CONTAIN ANY PACKAGES', {
                meta: {
                    apiArgs
                }
            });
        }

        const { rate_response } = await ShipEngineAPI.getRates(apiArgs);
        const response = {};

        // console.log("API ARGE FOR GETRATES", apiArgs)
        // apiArgs.shipment.packages.forEach((obj) => {
        //     console.log("package PACKAGE", obj)
        // })
        // console.log("RATE RESPONSE", rate_response);
        // console.log("RATES", rate_response.rates);

        // I want to log invalid rates for prod
        if(rate_response?.invalid_rates?.length) {
            global.logger.warn('ShipEngineService.getShippingRatesForCart - INVALID RATES', {
                meta: {
                    invalid_rates: rate_response.invalid_rates
                }
            });
        }

        // TODO: add logic that will not add to the rates obj
        // if the entry's shipping_amount is greater than the shipping_amount of a faster entry
        // - ignore rate if delivery_days/estimated_deleivery_date is null
        if(isObject(rate_response) && Array.isArray(rate_response.rates)) {
            rate_response.rates.forEach((obj) => {
                if(!response.hasOwnProperty(obj.delivery_days)) {
                    response[obj.delivery_days] = obj;
                }
                else {
                    if(response[obj.delivery_days].shipping_amount.amount > obj.shipping_amount.amount) {
                        response[obj.delivery_days] = obj;
                    }
                }
            });
        }

        // Return the rates and the packing results that those rates were based on.
        return {
            rates: Object.values(response),
            packingResults: packingResults
        }
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw err;
    }
}


module.exports = {
    isDomesticShipment,
    getServiceCodesForCart,
    getCustomsConfig,
    getShippingRatesForCart,
    getProductArrayFromCart,
    getProductWeight,
    getApiPackageTypes,
    getRatesApiPayload
};
