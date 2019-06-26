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


function getSizeTypeSortOrder(size) {
    let types = globalTypes.product.sizes;
    let index = types.indexOf(size);
    return index > -1 ? index : types.length;
}


/***************************************
 * route handlers
 /**************************************/

 async function productSizeCreateHandler(request, h) {
    try {
        request.payload.sort = request.payload.sort || getSizeTypeSortOrder(request.payload.size)

        const ProductSize = await getModel().forge().save(
            request.payload,
            { method: 'insert' }
        )

        if(!ProductSize) {
            throw Boom.badRequest('Unable to create a a new product size.');
        }

        return h.apiSuccess(
            ProductSize.toJSON()
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


 async function productSizeUpdateHandler(request, h) {
    try {
        const ProductSize = await getModel().forge().save(
            request.payload,
            { method: 'update', patch: true }
        )

        if(!ProductSize) {
            throw Boom.badRequest('Unable to find product size.');
        }

        return h.apiSuccess(
            ProductSize.toJSON()
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
}


async function productSizeDeleteHandler(request, h) {
    try {
        const ProductSize = await getModel().destroy(
            { id: request.payload.id }
        );

        if(!ProductSize) {
            throw Boom.badRequest('Unable to find product size.');
        }

        return h.apiSuccess(
            ProductSize.toJSON()
        );
    }
    catch(err) {
        global.logger.error(err);
        global.bugsnag(err);
        throw Boom.badRequest(err);
    }
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
                // global.logger.debug("PRODUCT SIZE UPDATED", UpdatedProductSize.toJSON())
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
    getSizeTypeSortOrder,
    productSizeCreateHandler,
    productSizeUpdateHandler,
    productSizeDeleteHandler,
    decrementInventoryCount
}
