const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const _ = require('lodash');
const testHelpers = require('../../../testHelpers');
const { initProductsController } = require('../_controllerHelper');

const lab = exports.lab = Lab.script();
const describe = lab.experiment;
const expect = Code.expect;
const it = lab.test;

let routePrefix = testHelpers.getApiPrefix();


describe('Testing route: GET /product/subtypes', () => {

    it('returns a list of product types', async () => {
        const { server } = await initProductsController();

        const res = await server.inject({
            method: 'GET',
            url: `${routePrefix}/product/subtypes`
        });

        let data = JSON.parse(JSON.stringify(res.result.data));

        let areSubTypes = true;
        data.forEach((obj) => {
            if(!obj.name.includes('PRODUCT_SUBTYPE_')) {
                areSubTypes = false;
            }
        });

        expect(res.statusCode, 'Status code').to.equal(200);
        expect(areSubTypes).to.equal(true);
    });

});
