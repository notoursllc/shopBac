'use strict';

const Hoek = require('@hapi/hoek');
const testHelpers = require('../../testHelpers');
const serverSetup = require('./_serverSetup');
const productPicController = require('../../../../server/plugins/products/productPicController');
const productSizeController = require('../../../../server/plugins/products/productSizeController');

const ProductCtrl = require('../../../../server/plugins/products/ProductCtrl');
const ProductController = new ProductCtrl();

async function getServer() {
    return await testHelpers.getServer(
        Hoek.clone(serverSetup.manifest),
        serverSetup.composeOptions
    );
}

async function initProductsController() {
    const server = await getServer();
    ProductController.setServer(server);

    return {
        controller: ProductController,
        server
    };
}

async function initProductPicController() {
    const server = await getServer();
    productPicController.setServer(server);

    return {
        controller: productPicController,
        server
    };
}

async function initProductSizeController() {
    const server = await getServer();
    productSizeController.setServer(server);

    return {
        controller: productSizeController,
        server
    };
}


module.exports = {
    getServer,
    initProductsController,
    initProductPicController,
    initProductSizeController
}
