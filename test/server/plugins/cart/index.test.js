const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const Hoek = require('@hapi/hoek');
const queryString = require('query-string');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const testHelpers = require('../../testHelpers');
const { init } = require('../../../../server');

// const cartId = 'd81d1a96-4e8a-41ab-84ea-3c8336123598';
// const cartId = 'b0a6b70b-f8cf-4bea-88d5-1efbf14ef711';
const cartId = '255ca872-1bbb-4694-8e97-b7b2e6b04b60';

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


    it('should get a shipping label', async () => {
        const res = await server.inject({
            method: 'POST',
            url: testHelpers.getApiPrefix('/cart/shipping/label'),
            headers: {
                Cookie: cookie
            },
            payload: {
                id: cartId,
                tenant_id: process.env.TEST_TENANT_ID
            }
        });

        console.log("SHIPPING LABEL", res.result.data)
        expect(res.result.data.hasOwnProperty('label_id')).to.equal(true)
    });

});
