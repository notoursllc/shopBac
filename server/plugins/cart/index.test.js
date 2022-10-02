const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const Hoek = require('@hapi/hoek');
const queryString = require('query-string');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const testHelpers = require('../../testHelpers');
const { init } = require('../../index.js');

const cartId = '80187e8a-105d-4d00-968b-57f419332337';

describe('ROUTE: /cart', () => {
    let server;

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });


    it('should get the cart', async () => {
        const params = queryString.stringify({
            id: cartId,
            tenant_id: process.env.TEST_TENANT_ID,
            relations: true
        });

        const res = await server.inject({
            method: 'GET',
            url: testHelpers.getApiPrefix(`/cart?${params}`),
            headers: testHelpers.getRequestHeader()
        });

        // console.log("CART1", res.result.data)
    });


    it('should get a list of carts', async () => {
        const params = queryString.stringify(
            {
                where: ['closed_at', 'is not', 'NULL']
            },
            { arrayFormat: 'bracket' }
        );

        const res = await server.inject({
            method: 'GET',
            url: testHelpers.getApiPrefix(`/carts?${params}`),
            headers: testHelpers.getRequestHeader()
        });

        console.log("SHOPPING CARTS", res.result);
    });


    it('should get shipping estimates', async () => {
        const res = await server.inject({
            method: 'POST',
            url: testHelpers.getApiPrefix('/cart/shipping/estimate'),
            headers: testHelpers.getRequestHeader(),
            payload: {
                id: cartId,
                tenant_id: process.env.TEST_TENANT_ID
            }
        });

        console.log("ESTIMSATE", res.result.data)
        expect(res.result.data.length > 0).to.equal(true);
    });

});


describe('ROUTE: POST /cart/shipping/label', () => {
    let server;
    let cookie;

    beforeEach(async () => {
        server = await init();

        const res = await server.inject({
            method: 'POST',
            url: testHelpers.getApiPrefix('/tenant/member/login'),
            // headers: testHelpers.getRequestHeader(),
            payload: {
                email: process.env.TEST_USERNAME,
                password: process.env.TEST_PASSWORD
            }
        });

        cookie = res.headers['set-cookie'][0].split(';')[0];
        // console.log("COOKIE", cookie)
    });

    afterEach(async () => {
        await server.stop();
    });


    // it('should purchase a shipping label', async () => {
    //     const res = await server.inject({
    //         method: 'POST',
    //         url: testHelpers.getApiPrefix('/cart/shipping/label'),
    //         headers: {
    //             Cookie: cookie
    //         },
    //         payload: {
    //             id: cartId,
    //             tenant_id: process.env.TEST_TENANT_ID
    //         }
    //     });

    //     console.log("SHIPPING LABEL", res.result.data)
    //     expect(res.result.data.hasOwnProperty('label_id')).to.equal(true)
    // });

});


describe('ROUTE: POST /cart/shipped', () => {
    let server;
    let cookie;

    beforeEach(async () => {
        server = await init();

        const res = await server.inject({
            method: 'POST',
            url: testHelpers.getApiPrefix('/tenant/member/login'),
            // headers: testHelpers.getRequestHeader(),
            payload: {
                email: process.env.TEST_USERNAME,
                password: process.env.TEST_PASSWORD
            }
        });

        cookie = res.headers['set-cookie'][0].split(';')[0];
        // console.log("COOKIE", cookie)
    });

    afterEach(async () => {
        await server.stop();
    });


    it('should set the shipped_at value when the "shipped" flag is set in the payload', async () => {
        const res = await server.inject({
            method: 'POST',
            url: testHelpers.getApiPrefix('/cart/shipped'),
            headers: {
                Cookie: cookie
            },
            payload: {
                id: cartId,
                tenant_id: process.env.TEST_TENANT_ID,
                shipped: true
            }
        });

        console.log("SHIPPED AT: SET DATE", res.result.data)
        expect(res.result.data.shipped_at).not.to.equal(null)
    });


    it('should un-set the shipped_at value when the "shipped" flag is false', async () => {
        const res = await server.inject({
            method: 'POST',
            url: testHelpers.getApiPrefix('/cart/shipped'),
            headers: {
                Cookie: cookie
            },
            payload: {
                id: cartId,
                tenant_id: process.env.TEST_TENANT_ID,
                shipped: false
            }
        });

        expect(res.result.data.shipped_at).to.equal(null)
    });


    it('should un-set the shipped_at value when the "shipped" flag is not sent', async () => {
        const res = await server.inject({
            method: 'POST',
            url: testHelpers.getApiPrefix('/cart/shipped'),
            headers: {
                Cookie: cookie
            },
            payload: {
                id: cartId,
                tenant_id: process.env.TEST_TENANT_ID
            }
        });

        expect(res.result.data.shipped_at).to.equal(null)
    });

});


describe('ROUTE: POST /cart/resend-order-confirmation', {timeout: 20000}, () => {
    let server;
    let cookie;

    beforeEach(async () => {
        server = await init();

        const res = await server.inject({
            method: 'POST',
            url: testHelpers.getApiPrefix('/tenant/member/login'),
            // headers: testHelpers.getRequestHeader(),
            payload: {
                email: process.env.TEST_USERNAME,
                password: process.env.TEST_PASSWORD
            }
        });

        cookie = res.headers['set-cookie'][0].split(';')[0];
    });

    afterEach(async () => {
        await server.stop();
    });


    it('should resend the order confirmation email', async () => {
        const res = await server.inject({
            method: 'POST',
            url: testHelpers.getApiPrefix('/cart/resend-order-confirmation'),
            headers: {
                Cookie: cookie
            },
            payload: {
                id: cartId,
                tenant_id: process.env.TEST_TENANT_ID
            }
        });

        // console.log("RESEND EMAIL RESPONSE", res)
        expect(res.statusCode).to.equal(200)
    });

});


describe('ROUTE: GET /cart/refunds', {timeout: 20000}, () => {
    let server;
    let cookie;

    beforeEach(async () => {
        server = await init();

        const res = await server.inject({
            method: 'POST',
            url: testHelpers.getApiPrefix('/tenant/member/login'),
            // headers: testHelpers.getRequestHeader(),
            payload: {
                email: process.env.TEST_USERNAME,
                password: process.env.TEST_PASSWORD
            }
        });

        cookie = res.headers['set-cookie'][0].split(';')[0];
    });

    afterEach(async () => {
        await server.stop();
    });


    it('should return a list of refunds', async () => {
        const params = queryString.stringify(
            {
                where: ['cart_id', '=', cartId]
            },
            { arrayFormat: 'bracket' }
        );

        const res = await server.inject({
            method: 'GET',
            url: testHelpers.getApiPrefix(`/cart/refunds?${params}`),
            headers: {
                Cookie: cookie
            }
        });

        console.log("REFUND RESPONSE", res.result.data.toJSON())
        expect(res.statusCode).to.equal(200)
    });

});
