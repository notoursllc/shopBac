const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const { getServer } = require('../_controllerHelper');
const testHelpers = require('../../../testHelpers');

const lab = exports.lab = Lab.script();
const describe = lab.experiment;
const expect = Code.expect;
const it = lab.test;

let routePrefix = testHelpers.getApiPrefix();

describe('Testing route: GET /healthz', () => {

    it('should return a 200 status code', async () => {
        const server = await getServer();
        const res = await server.inject({
            method: 'GET',
            url: `${routePrefix}/healthz`
        });

        expect(res.statusCode, 'Status code').to.equal(200);
    });

});
