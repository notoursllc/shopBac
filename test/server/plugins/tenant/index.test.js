const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const Hoek = require('@hapi/hoek');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const testHelpers = require('../../testHelpers');
const { init } = require('../../../../server');




describe('ROUTE: POST /tenant/contactus', {timeout: 20000}, () => {
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


    it('should send an email to the admin', async () => {
        const res = await server.inject({
            method: 'POST',
            url: testHelpers.getApiPrefix('/tenant/contactus'),
            headers: {
                Cookie: cookie
            },
            payload: {
                name: 'test name',
                company: 'test company',
                email: 'test@test.com',
                message: 'This is the test message',
                tenant_id: process.env.TEST_TENANT_ID
            }
        });

        // console.log("RESEND EMAIL RESPONSE", res)
        expect(res.statusCode).to.equal(200)
    });

});
