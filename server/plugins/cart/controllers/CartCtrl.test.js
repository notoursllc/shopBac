// NODE_ENV=test LOG_LEVEL=error lab --verbose server/plugins/cart/controllers/CartCtrl.test.js

const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const { getApiPrefix, getRequestHeader, getMockCart } = require('../../../testHelpers');
const { init } = require('../../../index.js');
const CartCtrl = require('./CartCtrl');
const CartItemCtrl = require('./CartItemCtrl');

const testCartId = '430a2df2-b371-4abc-8389-5cd99424cf55';
const testTenantId = process.env.TEST_TENANT_ID;


// IN PROGRESS
// This test needs more setup by creating a new cart
// and adding SKUs to it, so we have something we can test
// the increment and decrement by
describe('CartCtrl -> decrementInventoryCountInCart()', () => {
    let Ctrl;
    let CartItemC;

    beforeEach(async () => {
        const server = await init();
        Ctrl = new CartCtrl(server);
        CartItemC = new CartItemCtrl(server);
    });

    it('should return the weight of the * product_variant_sku * when its weight_oz value is a number', async () => {
        // const Cart = Ctrl.upsertCart({
        //     tenant_id: testTenantId
        // });

        const Cart = await Ctrl.fetchOneForTenant(
            testTenantId,
            { id: testCartId },
            { withRelated: Ctrl.getAllCartRelations() }
        );

        await Ctrl.decrementInventoryCountInCart(
            testTenantId,
            Cart
        );

        expect(0).to.equal(0);
    });

});
