const axios = require('axios');
const isObject = require('lodash.isobject');
const BaseController = require('../../core/controllers/BaseController');
const PackageService = require('../../package-types/services/PackageService');


class ShipEngineCtrl extends BaseController {

    constructor(server) {
        super(server);
        this.server = server;
        this.tenant = null;
    }


    async fetchTenant(tenantId) {
        if(!this.tenant || this.tenant.get('id') !== tenantId) {
            this.tenant = await this.getTenant(tenantId);
        }

        return this.tenant;
    }


    async getAxios(tenantId) {
        const Tenant = await this.fetchTenant(tenantId);
        const apiKey = Tenant.get('shipengine_api_key');

        if(!apiKey) {
            throw new Error('Unable to obtain the ship engine API key from Tenant');
        }

        return axios.create({
            baseURL: 'https://api.shipengine.com/v1/',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
            },
            timeout: 10000, // wait for 10s
            validateStatus() {
                return true;
            }
        });
    }


    async getCarrierIdsForTenant(tenantId) {
        const Tenant = await this.fetchTenant(tenantId);
        return Tenant.get('shipengine_carriers')?.map((obj) => obj.id);
    }


    async isDomesticShipment(tenantId, cart) {
        const Tenant = await this.fetchTenant(tenantId);
        const countryCode = cart?.shipping_countryCodeAlpha2;

        if(!countryCode || countryCode === Tenant.get('shipping_from_countryCodeAlpha2')) {
            return true
        }

        return false;
    }


    async getServiceCodesForCart(tenantId, cart) {
        const Tenant = await this.fetchTenant(tenantId);
        const isDomestic = await this.isDomesticShipment(tenantId, cart);

        return Tenant.get('shipengine_carriers')?.map((obj) => {
            return obj.service_codes[isDomestic ? 'domestic' : 'international']
        });

        // fedex comparible: fedex_standard_overnight / fedex_international_economy
    }


    getProductWeight(productId, cart) {
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
    getCustomsConfig(cart) {
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


    async getApiPackageTypes(tenantId, cart, packageTypes) {
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
        const service_codes = await this.getServiceCodesForCart(tenantId, cart);
        if(
            (service_codes.includes('usps_priority_mail') || service_codes.includes('usps_priority_mail_international'))
            && !package_types.includes('package')
        ) {
            package_types.push('package');
        }

        return package_types;
    }


    getProductArrayFromCart(cartJson) {
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


    /**
     * Builds the API request payload for ShipEngineCtrl.getRates()
     *
     * Separating out this method from getShippingRatesForCart
     * so it can be unit tested.  It's important that the API
     * request payload is correct.
     *
     * @param {*} cart
     */
    async getRatesApiPayload(tenantId, cart, packageTypes) {
        const Tenant = await this.fetchTenant(tenantId);
        const carrierIds = await this.getCarrierIdsForTenant(tenantId);
        const serviceCodes = await this.getServiceCodesForCart(tenantId, cart);
        const shipmentIsDomestic = await this.isDomesticShipment(tenantId, cart);
        // const apiPackageTypes = await this.getApiPackageTypes(tenantId, cart, packageTypes);

        try {
            const apiPayload = {
                rate_options: {
                    carrier_ids: carrierIds,
                    service_codes: serviceCodes,
                    // package_types: apiPackageTypes,
                    calculate_tax_amount: false,
                    preferred_currency: 'usd'
                },
                shipment: {
                    ship_from: {
                        company_name: Tenant.get('shipping_from_company'),
                        name: Tenant.get('shipping_from_name'),
                        phone: Tenant.get('shipping_from_phone'),
                        address_line1: Tenant.get('shipping_from_streetAddress'),
                        // address_line2: Tenant.get('shipping_from_extendedAddress'),
                        city_locality: Tenant.get('shipping_from_city'),
                        state_province: Tenant.get('shipping_from_state'),
                        postal_code: Tenant.get('shipping_from_postalCode'),
                        country_code: Tenant.get('shipping_from_countryCodeAlpha2'),
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
                this.getProductArrayFromCart(cart),
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
            // ShipEngineCtrl.getRates(apiPayload) would not return any rates.
            const packedBoxes = packingResults.packed.map((obj) => {
                if(isObject(obj) && isObject(obj.box)) {
                    return obj.box;
                }
            });

            const apiPackageTypes = await this.getApiPackageTypes(tenantId, cart, packedBoxes);
            apiPayload.rate_options.package_types = apiPackageTypes;

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
                        apiPackage.weight.value += this.getProductWeight(prod.id, cart);
                    });
                }

                apiPayload.shipment.packages.push(apiPackage);
            });

            if(!shipmentIsDomestic) {
                apiPayload.shipment.customs = this.getCustomsConfig(cart);
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


    async getShippingRatesForCart(tenantId, cart, packageTypes) {
        try {
            // API call to get ShipEngine rates
            const { apiArgs, packingResults } = await this.getRatesApiPayload(tenantId, cart, packageTypes);
            // console.log("getShippingRatesForCart: API ARGS", apiArgs)
            // console.log("getShippingRatesForCart: API ARGS PACKAGES", apiArgs.shipment.packages)

            // If the apiArgs.shipment.packages is an empty array
            // then no rates will be returned by ShipEngineCtrl.getRates()
            // understandably, since it has ship_from and ship_to but no
            // idea of what the packages are.
            // I don't think it's the responsibility of this method to
            // determine how to handle this scenario.
            if(!apiArgs.shipment.packages.length) {
                global.logger.warn('ShipEngineCtrl.getShippingRatesForCart - API PAYLOAD DOES NOT CONTAIN ANY PACKAGES', {
                    meta: {
                        apiArgs
                    }
                });
            }

            const { rate_response } = await this.getRates(tenantId, apiArgs);
            const response = {};

            // apiArgs.shipment.packages.forEach((obj) => {
            //     console.log("package PACKAGE", obj)
            // })
            // console.log("RATE RESPONSE", rate_response);
            // console.log("RATES", rate_response.rates);
            // console.log("INVALID RATES", rate_response.invalid_rates);

            // I want to log invalid rates for prod
            if(rate_response?.invalid_rates?.length) {
                global.logger.warn('ShipEngineCtrl.getShippingRatesForCart - INVALID RATES', {
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


    /*
    * SHIPENGINE API
    */


    /**
     * https://www.shipengine.com/docs/rates/
     *
     * @param {*} payload
     * @returns
     */
    async getRates(tenantId, payload) {
        global.logger.info('REQUEST: ShipEngineCtrl.getRates', {
            meta: {
                payload
            }
        });

        const $axios = await this.getAxios(tenantId);
        const { data } = await $axios.post('rates', payload);

        global.logger.info('RESPONSE: ShipEngineCtrl.getRates', {
            meta: { data }
        });

        if(data?.errors?.length) {
            global.logger.warn('RESPONSE: ShipEngineCtrl.getRates ERRORS', {
                meta: data.errors
            });
        }

        return data;
    }


    async getRate(tenantId, id) {
        global.logger.info('REQUEST: ShipEngineCtrl.getRate', {
            meta: { id }
        });

        const $axios = await this.getAxios(tenantId);
        const { data } = await $axios.get(`rates/${id}`);

        global.logger.info('RESPONSE: ShipEngineCtrl.getRate', {
            meta: { data }
        });

        return data;
    }


    async buyShippingLabel(tenantId, rateId) {
        global.logger.info('REQUEST: ShipEngineCtrl.buyShippingLabel', {
            meta: { rateId }
        });

        const $axios = await this.getAxios(tenantId);
        const { data } = await $axios.post(`labels/rates/${rateId}`);

        global.logger.info('RESPONSE: ShipEngineCtrl.buyShippingLabel', {
            meta: { data }
        });

        return data;
    }


    async getShippingLabel(tenantId, labelId) {
        global.logger.info('REQUEST: ShipEngineCtrl.getShippingLabel', {
            meta: { labelId }
        });

        const $axios = await this.getAxios(tenantId);
        const { data } = await $axios.get(`labels/${labelId}`);

        global.logger.info('RESPONSE: ShipEngineCtrl.getShippingLabel', {
            meta: { data }
        });

        return data;
    }


    async validateAddresses(tenantId, payload) {
        global.logger.info('REQUEST: ShipEngineCtrl.validateAddresses', {
            meta: { payload }
        });

        // https://www.shipengine.com/docs/addresses/validation/
        const $axios = await this.getAxios(tenantId);
        const { data } = await $axios.post('addresses/validate', payload);

        global.logger.info('RESPONSE: ShipEngineCtrl.validateAddresses', {
            meta: { data }
        });

        return data;
    }
}


module.exports = ShipEngineCtrl;
