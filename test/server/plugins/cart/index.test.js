const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const Hoek = require('@hapi/hoek');
const queryString = require('query-string');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const testHelpers = require('../../testHelpers');
const { init } = require('../../../../server');


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
            id: 'e4fac187-66c1-42e9-866c-0e0a83395098', //TODO
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


    it('should get shipping estimates', async () => {
        const res = await server.inject({
            method: 'POST',
            url: testHelpers.getApiPrefix('/cart/shipping/estimate'),
            headers: testHelpers.getRequestHeader(),
            payload: {
                id: '02211d05-5474-42af-b661-39d995ecb35e', //TODO
                tenant_id: process.env.TEST_TENANT_ID
            }
        });

        console.log("ESTIMSATE", res.result.data)
        expect(res.result.data.length > 0).to.equal(true);
    });

});
