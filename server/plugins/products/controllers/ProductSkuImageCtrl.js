    const Joi = require('@hapi/joi');
const isObject = require('lodash.isobject');
const ProductImageCtrl = require('./ProductImageCtrl');
const StorageService = require('../../core/services/StorageService');
const { resizeBase64ToMultipleImages } = require('../../core/services/ImageService');
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


    /*
    async resizeAndUpsertImage(image, productSkuId, tenantId) {
        global.logger.info(`REQUEST: ProductSkuImageCtrl.resizeAndUpsertImage (${this.modelName})`, {
            meta: {
                productSkuId,
                tenantId,
                image
            }
        });

        const resizeResults = await Promise.all(
            resizeBase64ToMultipleImages(
                image.image_url,
                [
                    { width: 600 },
                    { width: 1000 },
                    { width: 75 }
                ],
                true
            )
        );

        const upsertData = {
            product_sku_id: productSkuId,
            tenant_id: tenantId,
            alt_text: image.alt_text,
            ordinal: image.ordinal,
            published: true
        };

        if(image.id) {
            upsertData.id = image.id;
        }


        if(resizeResults[0]) {
            upsertData.width = resizeResults[0].width;
            upsertData.image_url = resizeResults[0].image_url;
            upsertData.variants = resizeResults.filter((obj, index) => index > 0); // remove the first one because we just used it above
        }

        return this.upsertModel(upsertData);
    }
    */


    upsertImages(images, productSkuId, tenantId) {
        try {
            const promises = [];

            global.logger.info(`REQUEST: ProductSkuImageCtrl.upsertImages (${this.modelName})`, {
                meta: {
                    tenantId,
                    productSkuId,
                    images
                }
            });

            if(Array.isArray(images)) {
                images.forEach((img) => {
                    promises.push(
                        this.upsertModel({
                            tenant_id: tenantId,
                            product_sku_id: productSkuId,
                            ...img
                        })
                    );
                });
            }

            global.logger.info(`RESPONSE: ProductSkuImageCtrl.upsertImages (${this.modelName}) - returning ${promises.length} promises`);

            return Promise.all(promises);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
        }
    }

}

module.exports = ProductSkuImageCtrl;
