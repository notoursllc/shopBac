'use strict';

const Boom = require('@hapi/boom');
const globalTypes = require('../../global_types.js')

let server = null;


function getModel() {
    return server.app.bookshelf.model('ProductSize');
}


function setServer(s) {
    server = s;
}



async function decrementInventoryCount(ShoppingCart) {
    try {
        let cart = ShoppingCart.toJSON();
        // global.logger.debug("IN DECREMENT INVENTORY COUNT", cart)

        // async/await will work in for/of loops
        // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
        for(const obj of cart.cart_items) {
            const ProductSize = await getModel().forge({
                product_id: obj.product_id,
                size: obj.variants.size
            }).fetch();

            if(ProductSize) {
                let newInventoryCount = ProductSize.get('inventory_count') - obj.qty;
                if(newInventoryCount < 0) {
                    newInventoryCount = 0;
                }

                const UpdatedProductSize = await getModel().update(
                    { inventory_count: newInventoryCount },
                    { id: ProductSize.get('id') }
                );
            }
        }
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
    }
}


module.exports = {
    setServer,
    decrementInventoryCount
}
