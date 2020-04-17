const Joi = require('@hapi/joi');
const isObject = require('lodash.isobject');
const ProductImageCtrl = require('./ProductImageCtrl');
const StorageService = require('../../core/services/StorageService')
const { makeArray } = require('../../../helpers.service');

class ProductSkuImageCtrl extends ProductImageCtrl {

    constructor(server) {
        super(server, 'ProductSkuImage');
    }


    // getSchema() {
    //     // Same as ProductImageCtrl schema, except
    //     // product_id needs to be switched to product_sku_id
    //     let productImageSchema = super.getSchema();
    //     delete productImageSchema.product_id;

    //     return {
    //         product_sku_id: Joi.string().uuid().required(),
    //         ...productImageSchema
    //     };
    // }

    getUploadSchema() {
        // Same as ProductImageCtrl schema, except
        // product_id needs to be switched to product_sku_id
        const productImageSchema = super.getUploadSchema();
        delete productImageSchema.product_id;

        return {
            product_sku_id: Joi.string().uuid().required(),
            ...productImageSchema
        };
    }


    upsertHandler(request, h) {
        this.addTenantId(request, 'payload');
        return super.upsertHandler(request, h);
    }


    async upsertImageFromRequest(request, index) {
        // request.payload.images and request.payload.alt_test are not arrays if only one image is
        // uploaded, so converting to arrays
        const id = makeArray(request.payload.id)[index];
        const image = makeArray(request.payload.image)[index];

        const upsertData = {
            tenant_id: this.getTenantId(request),
            product_sku_id: request.payload.product_sku_id,
            published: true,
            alt_text: makeArray(request.payload.alt_text)[index],
            ordinal: makeArray(request.payload.ordinal)[index]
        };

        if(id) {
            upsertData.id = id;
        }

        if(isObject(image)) {
            const storedImages = await Promise.all([
                StorageService.resizeAndWrite(image, 600),
                StorageService.resizeAndWrite(image, 1000)
            ]);

            if(Array.isArray(storedImages) && storedImages.length) {
                upsertData.image_url = storedImages[0].url;
                upsertData.width = storedImages[0].width;
                upsertData.variants = [storedImages[1]];
            }
        }

        return this.upsertModel(upsertData);
    }

}

module.exports = ProductSkuImageCtrl;
