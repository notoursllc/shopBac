require('dotenv').config();

const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const { after, before, describe, it } = exports.lab = Lab.script();
const addressAPI = require('../../../../../server/plugins/shipping/shippoAPI/address');


describe('ShippoAPI: validateNewAddress', () => {

    it('should return a success response', async() => {
        let res = null;
        let error = null;

        try {
            res = await addressAPI.validateNewAddress({
                name: "Wayne Gretzky",
                company: "Shippo",
                street1: "215 Clayton St.",
                city: "San Francisco",
                state: "CA",
                zip: "94117",
                country: "US",
                email: "shippotle@goshippo.com"
            });
        }
        catch(err) {
            error = err;
            // console.log(err);
        }

        // console.log("ADDRESS VALIDATION RESPONSE", res)

        expect( res ).to.be.an.object();
        expect(res.validation_results.is_valid).to.equal(true);
        expect( error ).not.to.be.an.object();
    });


    it('should return an error when required fields are not sent', async() => {
        let res = null;
        let error = null;

        try {
            res = await addressAPI.validateNewAddress({
                // name: "Shawn Ippotle",
                company: "Shippo",
                street1: "215 Clayton St.",
                // city: "San Francisco",
                // state: "CA",
                // zip: "94117",
                country: "US",
                email: "shippotle@goshippo.com"
            });
        }
        catch(err) {
            error = err;
            // console.log(err);
        }

        // console.log("ADDRESS VALIDATION RESPONSE2", res)
        // console.log("ADDRESS VALIDATION RESPONSE MSG", res.validation_results.messages)

        expect( res ).to.be.an.object();
        expect(res.validation_results.is_valid).to.equal(false);
        expect( error ).not.to.be.an.object();
    });

});
