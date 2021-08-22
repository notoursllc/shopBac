const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const { init } = require('../../../../server');

const ShipEngineAPI = require('../../../../server/plugins/cart/services/shipEngine/ShipEngineAPI');


describe('ShipEngineAPI -> getShippingLabel()', () => {
    let server;

    beforeEach(async () => {
        server = await init();
    });

    afterEach(async () => {
        await server.stop();
    });

    it('should return label data', async () => {
        const labelId = 'se-483432306';
        const data = await ShipEngineAPI.getShippingLabel(labelId);

        expect(data.label_id).to.equal(labelId);
    });

});
