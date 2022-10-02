const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const Hoek = require('@hapi/hoek');
const queryString = require('query-string');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const testHelpers = require('../../testHelpers');
const { init } = require('../../index.js');



describe('ROUTE: /master_types/all', () => {
    let server;

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });


    it('should get the all master types', async () => {
        const params = queryString.stringify({
            tenant_id: process.env.TEST_TENANT_ID,
            _sort: 'ordinal:asc'
        });

        const res = await server.inject({
            method: 'GET',
            url: testHelpers.getApiPrefix(`/master_types/all?${params}`),
            headers: testHelpers.getRequestHeader()
        });

        console.log("ALL MASTER TYPES", res.result.data);

        [
            'product_sleeve_length_type',
            'product_size_type',
            'product_gender_type',
            'product_basic_color_type',
            'product_feature_type',
            'product_fit_type',
            'product_sub_type',
            'product_type',
            'product_vendor_type',
            'product_sales_channel_type',
        ].forEach((type) => {
            expect(res.result.data.hasOwnProperty(type)).to.equal(true);
        });
    });
});
