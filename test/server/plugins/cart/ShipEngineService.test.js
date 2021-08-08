const queryString = require('query-string');
const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const { getApiPrefix, getRequestHeader, getMockCart } = require('../../testHelpers');
const { init } = require('../../../../server');

const ShipEngineService = require('../../../../server/plugins/cart/services/shipEngine/ShipEngineService');
const PackageTypeController = require('../../../../server/plugins/package-types/controllers/PackageTypeCtrl');

const testCartId = '3904d7ab-aa81-478f-bd39-ec9129e52785';


function getMockPackageType(length, width, height, mergeObj) {
    const obj = {
        length_cm: length,
        width_cm: width,
        height_cm: height,
        volume_cm: length * width * height
    };

    return Object.assign({}, obj, mergeObj);
}

describe('ShipEngineService -> getProductWeight()', () => {

    it('should return the weight of the * product_variant_sku * when its weight_oz value is a number', async () => {
        const weight = ShipEngineService.getProductWeight(1, {
            cart_items: [
                {
                    product: { id: 1 },
                    product_variant: { weight_oz: 2 },
                    product_variant_sku: { weight_oz: 3 },  // <=====
                },
                {
                    product: { id: 2 },
                    product_variant: { weight_oz: 4 },
                    product_variant_sku: { weight_oz: 5 },
                }
            ]
        });

        expect(weight).to.equal(3);
    });

    it('should return the weight of the * product_variant * when the product_variant_sku weight_oz value is zero', async () => {
        const weight = ShipEngineService.getProductWeight(1, {
            cart_items: [
                {
                    product: { id: 1 },
                    product_variant: { weight_oz: 2 }, // <=====
                    product_variant_sku: { weight_oz: 0 },
                },
                {
                    product: { id: 2 },
                    product_variant: { weight_oz: 4 },
                    product_variant_sku: { weight_oz: 5 },
                }
            ]
        });

        expect(weight).to.equal(2);
    });


    it('should return the weight of the * product_variant * when the weight_oz of product_variant_sku is null', async () => {
        const weight = ShipEngineService.getProductWeight(2, {
            cart_items: [
                {
                    product: { id: 1 },
                    product_variant: { weight_oz: 2 },
                    product_variant_sku: { weight_oz: 3 },
                },
                {
                    product: { id: 2 },
                    product_variant: { weight_oz: 4 }, // <=====
                    product_variant_sku: { weight_oz: null },
                }
            ]
        });

        // console.log("BUILD PRODUCTS", products)

        expect(weight).to.equal(4);
    });


    it('should return zero if weight_oz of both product_variant_sku and product_variant is null', async () => {
        const weight = ShipEngineService.getProductWeight(2, {
            cart_items: [
                {
                    product: { id: 1 },
                    product_variant: { weight_oz: 2 },
                    product_variant_sku: { weight_oz: 3 },
                },
                {
                    product: { id: 2 },
                    product_variant: { weight_oz: null },
                    product_variant_sku: { weight_oz: null },
                }
            ]
        });

        expect(weight).to.equal(0);
    });


    it('should return the weight of product_variant_sku if the value is a string', async () => {
        const weight = ShipEngineService.getProductWeight(1, {
            cart_items: [
                {
                    product: { id: 1 },
                    product_variant: { weight_oz: '11.11' },
                    product_variant_sku: { weight_oz: '22.22' },
                }
            ]
        });

        expect(weight).to.equal(22.22);
    });

});


///////////////


describe('ShipEngineService -> isDomesticShipment()', () => {

    it('should return false when "shipping_countryCodeAlpha2" is not US', async () => {
        expect(
            ShipEngineService.isDomesticShipment(
                { shipping_countryCodeAlpha2: 'CA' }
            )
        ).to.equal(false);
    });

    it('should return true when "shipping_countryCodeAlpha2" is US', async () => {
        expect(
            ShipEngineService.isDomesticShipment(
                { shipping_countryCodeAlpha2: 'US' }
            )
        ).to.equal(true);
    });

    it('should return true when "shipping_countryCodeAlpha2" is null', async () => {
        expect(
            ShipEngineService.isDomesticShipment(
                { shipping_countryCodeAlpha2: null }
            )
        ).to.equal(true);
    });

    it('should return true when no arguments are sent', async () => {
        expect(
            ShipEngineService.isDomesticShipment()
        ).to.equal(true);
    });

    it('should return true when the object does not have a "shipping_countryCodeAlpha2" property', async () => {
        expect(
            ShipEngineService.isDomesticShipment({})
        ).to.equal(true);
    });

});


///////////////


describe('ShipEngineService -> getServiceCodesForCart()', () => {

    it('should return USPS domestic provider for domestic shipment', async () => {
        expect(
            ShipEngineService.getServiceCodesForCart(
                { shipping_countryCodeAlpha2: 'US' }
            )
        ).to.equal(
            ['usps_priority_mail']
        );
    });

    it('should return USPS international for international shipment', async () => {
        expect(
            ShipEngineService.getServiceCodesForCart(
                { shipping_countryCodeAlpha2: 'CA' }
            )
        ).to.equal(
            ['usps_priority_mail_international']
        );
    });

});


///////////////


describe('ShipEngineService -> getCustomsConfig()', () => {

    it('should return a "customes_items" length that is the same length as the carts "cart_items" array', async () => {
        const cart1 = getMockCart(1);
        const customsConfig = ShipEngineService.getCustomsConfig(cart1);

        expect(
            customsConfig.customs_items.length
        ).to.equal(
            cart1.cart_items.length
        );

        const cart2 = getMockCart(2);
        const customsConfig2 = ShipEngineService.getCustomsConfig(cart2);

        expect(
            customsConfig2.customs_items.length
        ).to.equal(
            cart2.cart_items.length
        );
    });


    it('should use the "display_price" value from the product_variant when the product_variant_sku does not have a display_price', async () => {
        const cart = getMockCart(1);
        delete cart.cart_items[0].product_variant_sku.display_price;

        const customsConfig = ShipEngineService.getCustomsConfig(cart);

        expect(
            customsConfig.customs_items[0].value.amount
        ).to.equal(
            cart.cart_items[0].product_variant.display_price
        );
    });


    it('should use the "display_price" value from the product_variant_sku when available', async () => {
        const cart = getMockCart(1);
        const customsConfig = ShipEngineService.getCustomsConfig(cart);

        expect(
            customsConfig.customs_items[0].value.amount
        ).to.equal(
            cart.cart_items[0].product_variant_sku.display_price
        );
    });

});


///////////////


describe('ShipEngineService -> getProductArrayFromCart()', () => {

    let server;

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    it('result length should equal the total number of cart items', async () => {
        const params = queryString.stringify({
            id: testCartId,
            tenant_id: process.env.TEST_TENANT_ID,
            relations: true
        });

        const res = await server.inject({
            method: 'GET',
            url: getApiPrefix(`/cart?${params}`),
            headers: getRequestHeader()
        });

        const cart = res.result.data;
        const products = ShipEngineService.getProductArrayFromCart(cart);

        // console.log("BUILD PRODUCTS", products)

        expect(cart.num_items).to.equal(products.length);
    });

});


///////////////


describe('ShipEngineService -> getApiPackageTypes()', () => {

    let server;

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    it('should return all "code_for_carrier" values that have been specified in the PackageType objejcts', async () => {
        const packageTypes = ShipEngineService.getApiPackageTypes(
            getMockCart(1),
            [
                getMockPackageType(11, 6, 6, {
                    label: 'Mock Package Type 1',
                    code_for_carrier: 'medium_flat_rate_box'
                }),

                getMockPackageType(5, 3, 3, {
                    label: 'Mock Package Type 2',
                    code_for_carrier: 'small_flat_rate_box'
                }),
            ]
        );

        // console.log("PACKAGE TYPES", packageTypes)

        expect(packageTypes.includes('medium_flat_rate_box')).to.equal(true);
        expect(packageTypes.includes('small_flat_rate_box')).to.equal(true);
        expect(packageTypes.includes('package')).to.equal(true);
    });


    it('should only return the "package" type when the PackageType objects do not specify any "code_for_carrier" values', async () => {
        const packageTypes = ShipEngineService.getApiPackageTypes(
            getMockCart(1),
            [
                getMockPackageType(11, 6, 6, {
                    label: 'Mock Package Type 1'
                }),

                getMockPackageType(5, 3, 3, {
                    label: 'Mock Package Type 2'
                }),
            ]
        );

        // console.log("PACKAGE TYPES", packageTypes)

        expect(packageTypes.length).to.equal(1);
        expect(packageTypes.includes('package')).to.equal(true);
    });
});


/////////////////


describe('ShipEngineService -> getRatesApiPayload()', () => {
    let server;

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    it(`should return a "service_codes" value of "usps_priority_mail"
        when the carts shipping_countryCodeAlpha2 is "US"`, async () => {
        // const PackageTypeCtrl = new PackageTypeController(server);
        // const results = await PackageTypeCtrl.getAllPackageTypes(
        //     process.env.TEST_TENANT_ID,
        //     true
        // );
        // const allPackageTypes = results.toJSON();

        // console.log("getShippingRatesForCart - allPackageTypes", allPackageTypes)

        const { apiArgs }  = ShipEngineService.getRatesApiPayload(
            getMockCart(1),
            [] // package types dont matter for this test
        );

        expect(
            apiArgs.rate_options.service_codes
        ).to.equal(
            [ 'usps_priority_mail' ]
        );
    });


    it(`should return a "service_codes" value of "usps_priority_mail_international"
        when the carts shipping_countryCodeAlpha2 is not "US"`, async () => {
        const cart = getMockCart(1);
        cart.shipping_countryCodeAlpha2 = 'CA';

        const { apiArgs } = ShipEngineService.getRatesApiPayload(
            cart,
            [] // package types dont matter for this test
        );

        expect(
            apiArgs.rate_options.service_codes
        ).to.equal(
            [ 'usps_priority_mail_international' ]
        );
    });


    it('should return a "ship_to" object that matches the shipping props in the cart', async () => {
        const cart = getMockCart(1);
        const { apiArgs } = ShipEngineService.getRatesApiPayload(
            cart,
            [] // package types dont matter for this test
        );

        const shipTo = apiArgs.shipment.ship_to;

        expect(shipTo.name).to.equal(`${cart.shipping_firstName} ${cart.shipping_lastName}`);
        expect(shipTo.address_line1).to.equal(cart.shipping_streetAddress);
        expect(shipTo.city_locality).to.equal(cart.shipping_city);
        expect(shipTo.state_province).to.equal(cart.shipping_state);
        expect(shipTo.postal_code).to.equal(cart.shipping_postalCode);
        expect(shipTo.country_code).to.equal(cart.shipping_countryCodeAlpha2);
        expect(shipTo.phone).to.equal(cart.shipping_phone);
    });



    it('should return one package', async () => {
        const { apiArgs } = ShipEngineService.getRatesApiPayload(
            getMockCart(1),
            [
                getMockPackageType(40, 25, 3, {
                    label: 'Mock Package Type 1'  // <-----
                }),

                getMockPackageType(5, 3, 3, {
                    label: 'Mock Package Type 2'
                }),
            ]
        );

        // console.log("API PAYLOAD 3", apiArgs.shipment.packages)

        expect(apiArgs.shipment.packages.length).to.equal(1);

        const pkg1 = apiArgs.shipment.packages[0];
        expect(pkg1.dimensions.length).to.equal(40);
        expect(pkg1.dimensions.width).to.equal(25);
        expect(pkg1.dimensions.height).to.equal(3);
    });


    it('should return two packages because the the box cant hold both cart products', async () => {
        const { apiArgs } = ShipEngineService.getRatesApiPayload(
            getMockCart(2),
            [
                getMockPackageType(40, 25, 3, {
                    label: 'Mock Package Type 1'  // <-----
                }),

                getMockPackageType(5, 3, 3, {
                    label: 'Mock Package Type 2'
                }),
            ]
        );

        // console.log("API PAYLOAD 3", apiArgs.shipment.packages)

        expect(apiArgs.shipment.packages.length).to.equal(2);

        const pkg1 = apiArgs.shipment.packages[0];
        expect(pkg1.dimensions.length).to.equal(40);
        expect(pkg1.dimensions.width).to.equal(25);
        expect(pkg1.dimensions.height).to.equal(3);

        const pkg2 = apiArgs.shipment.packages[1];
        expect(pkg2.dimensions.length).to.equal(40);
        expect(pkg2.dimensions.width).to.equal(25);
        expect(pkg2.dimensions.height).to.equal(3);
    });


    it('should return no packages because none of the package_types fit the product', async () => {
        const { apiArgs } = ShipEngineService.getRatesApiPayload(
            getMockCart(1),
            [
                getMockPackageType(9, 4, 4, {
                    label: 'Mock Package Type 1'
                }),

                getMockPackageType(2, 2, 2, {
                    label: 'Mock Package Type 2'
                }),
            ]
        );

        // console.log("API PAYLOAD", apiArgs.shipment.packages)
        expect(apiArgs.shipment.packages.length).to.equal(0);
    });


    it('should return two packages because one of the cart products is "ship_alone"', async () => {
        const cart = getMockCart(2);
        cart.cart_items[1].product.ship_alone = true;

        const { apiArgs } = ShipEngineService.getRatesApiPayload(
            cart,
            [
                getMockPackageType(40, 25, 3, {
                    label: 'Mock Package Type 1' // <---
                }),

                getMockPackageType(11, 6, 6, {
                    label: 'Mock Package Type 2'
                })
            ]
        );

        // console.log("API PAYLOAD", apiArgs.shipment.packages)
        expect(apiArgs.shipment.packages.length).to.equal(2);

        // verify that the right package dimensions were returned
        const pkg1 = apiArgs.shipment.packages[0];
        expect(pkg1.dimensions.length).to.equal(40);
        expect(pkg1.dimensions.width).to.equal(25);
        expect(pkg1.dimensions.height).to.equal(3);

        const pkg2 = apiArgs.shipment.packages[1];
        expect(pkg2.dimensions.length).to.equal(40);
        expect(pkg2.dimensions.width).to.equal(25);
        expect(pkg2.dimensions.height).to.equal(3);
    });


    it('should return a "customs" property when cart.shipping_countryCodeAlpha2 is not "US"', async () => {
        const cart = getMockCart(1);
        cart.shipping_countryCodeAlpha2 = 'CA';

        const { apiArgs } = ShipEngineService.getRatesApiPayload(
            cart,
            [] // package types dont matter for this test
        );

        // console.log("API PAYLOAD", apiArgs.shipment)
        expect(
            apiArgs.shipment.hasOwnProperty('customs')
        ).to.equal(true);
    });


    it('should NOT return a "customs" property when cart.shipping_countryCodeAlpha2 is "US"', async () => {
        const { apiArgs } = ShipEngineService.getRatesApiPayload(
            getMockCart(1),
            [] // package types dont matter for this test
        );

        // console.log("API PAYLOAD", apiArgs.shipment)
        expect(
            apiArgs.shipment.hasOwnProperty('customs')
        ).to.equal(false);
    });

    it('should contain a "package_type" property that includes the "code_for_carrier" value of the selected box', async () => {
        const cart = getMockCart(2);
        cart.cart_items[1].product.ship_alone = true;

        const { apiArgs } = ShipEngineService.getRatesApiPayload(
            cart,
            [
                getMockPackageType(40, 25, 3, {
                    label: 'Mock Package Type 1',
                    code_for_carrier: 'small_flat_rate_box'  // <---
                }),

                getMockPackageType(11, 6, 6, {
                    label: 'Mock Package Type 2',
                    code_for_carrier: 'large_flat_rate_box'
                })
            ]
        );

        // console.log("API PAYLOAD", apiArgs.shipment.packages)
        expect(apiArgs.rate_options.package_types.length).to.equal(2);
        expect(apiArgs.rate_options.package_types.includes('small_flat_rate_box')).to.equal(true);
        expect(apiArgs.rate_options.package_types.includes('package')).to.equal(true);
    });

});


/////////////////


describe('ShipEngineService -> getShippingRatesForCart()', () => {
    let server;

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });


    it(`should return rates from ShipEngine that uses "package_type: package"
        because none of the PackageTypes given contain a "code_for_carrier" value`, async () => {
        const { rates } = await ShipEngineService.getShippingRatesForCart(
            getMockCart(1),
            [
                getMockPackageType(40, 25, 3, {
                    label: 'Mock Package Type 1'  // <---
                })
            ]
        );

        // console.log("RATE RESPONSE", rateResponse)

        expect(rates.length).to.equal(1);
        expect(rates[0].package_type).to.equal('package');
    });


    it(`should return rates from ShipEngine that uses "package_type: small_flat_rate_box"
        because the PackageType used has a "code_for_carrier" value of "small_flat_rate_box"`, async () => {
        const { rates } = await ShipEngineService.getShippingRatesForCart(
            getMockCart(1),
            [
                getMockPackageType(40, 25, 3, {
                    label: 'Mock Package Type 1',
                    code_for_carrier: 'small_flat_rate_box' // <---
                })
            ]
        );

        // console.log("RATE RESPONSE", rates)

        expect(rates.length).to.equal(1);
        expect(rates[0].package_type).to.equal('small_flat_rate_box');
    });


    it(`should not return any rates from ShipEngine because we have not provided
        any package types that fit the product"`, async () => {
        const { rates } = await ShipEngineService.getShippingRatesForCart(
            getMockCart(1),
            [
                getMockPackageType(30, 15, 3, {
                    label: 'Mock Package Type 1',
                    code_for_carrier: 'small_flat_rate_box'
                })
            ]
        );

        // console.log("SERVICE RESPONSE", rates)

        expect(rates.length).to.equal(0);
    });


    it(`should not return any rates from ShipEngine because the carts shipping data is null"`, async () => {
        const cart = getMockCart(1);
        cart.shipping_streetAddress = null;
        cart.shipping_city = null;
        cart.shipping_state = null;
        cart.shipping_postalCode = null;

        const { rates } = await ShipEngineService.getShippingRatesForCart(
            cart,
            [
                // even though the box fits, the response should still be empty
                getMockPackageType(50, 50, 50, {
                    label: 'Mock Package Type 1',
                    code_for_carrier: 'small_flat_rate_box'
                })
            ]
        );

        // console.log("SERVICE RESPONSE", rates)

        expect(rates.length).to.equal(0);
    });


    it(`should not return any rates from ShipEngine because the product and the package dont have any weight defined"`, async () => {
        const cart = getMockCart(1);
        cart.cart_items[0].product_variant.weight_oz = null;
        cart.cart_items[0].product_variant_sku.weight_oz = null;

        const { rates } = await ShipEngineService.getShippingRatesForCart(
            cart,
            [
                // even though the box fits, the response should still be empty
                getMockPackageType(50, 50, 50, {
                    label: 'Mock Package Type 1',
                    code_for_carrier: 'small_flat_rate_box'
                })
            ]
        );

        // console.log("SERVICE RESPONSE", rates)

        expect(rates.length).to.equal(0);
    });


    // it('should return rates from ShipEngine', async () => {
    //     const PackageTypeCtrl = new PackageTypeController(server);

    //     const results = await PackageTypeCtrl.getAllPackageTypes(
    //         process.env.TEST_TENANT_ID,
    //         true
    //     )

    //     const allPackageTypes = results.toJSON();

    //     // console.log("getShippingRatesForCart - allPackageTypes", allPackageTypes)

    //     const { rates } = ShipEngineService.getShippingRatesForCart(
    //         mockCart,
    //         allPackageTypes
    //     );

    //     // expect(cart.num_items).to.equal(products.length);
    // });


    /*
    it('getShippingRatesForCart() - ???', async () => {
        const PackageTypeCtrl = new PackageTypeController(server);

        const params = queryString.stringify({
            id: testCartId, //TODO
            tenant_id: process.env.TEST_TENANT_ID,
            relations: true
        });

        const results = await Promise.all([
            server.inject({
                method: 'GET',
                url: getApiPrefix(`/cart?${params}`),
                headers: getRequestHeader()
            }),

            PackageTypeCtrl.getAllPackageTypes(
                process.env.TEST_TENANT_ID,
                true
            )
        ]);

        const cart = results[0].result.data;
        const packageTypes = results[1].toJSON();

        // console.log("getShippingRatesForCart 1", cart)
        // console.log("getShippingRatesForCart 2", packageTypes)

        const { rates } = ShipEngineService.getShippingRatesForCart(
            cart,
            packageTypes
        );

        // expect(cart.num_items).to.equal(products.length);
    });
    */

});
