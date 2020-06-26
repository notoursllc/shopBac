const Joi = require('@hapi/joi');
const isObject = require('lodash.isobject');
const ProductImageCtrl = require('./ProductImageCtrl');
const StorageService = require('../../core/services/StorageService');
const { resizeBase64 } = require('../../core/services/ImageService');
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


    async resizeAndUpsertImage(image, productSkuId, tenantId) {
        global.logger.info(`REQUEST: ProductSkuImageCtrl.resizeAndUpsertImage (${this.modelName})`, {
            meta: {
                productSkuId,
                tenantId,
                image
            }
        });

        const resizeResults = await Promise.all([
            resizeBase64(image.image_url, { width: 600 }, true),
            resizeBase64(image.image_url, { width: 1000 }, true),
            resizeBase64(image.image_url, { width: 75 }, true)
        ]);

        return this.upsertModel({
            product_sku_id: productSkuId,
            tenant_id: tenantId,
            width: resizeResults[0].width,
            image_url: resizeResults[0].image_url,
            alt_text: image.alt_text,
            ordinal: image.ordinal,
            published: true,
            variants: resizeResults.filter((obj, index) => index > 0)
        });
    }


    upsertImages(images, productSkuId, tenantId) {
        try {
            const promises = [];

            global.logger.info(`REQUEST: ProductSkuImageCtrl.upsertImages (${this.modelName})`, {
                meta: {
                    productSkuId,
                    tenantId,
                    images
                }
            });

            if(Array.isArray(images)) {
                images.forEach((img) => {
                    promises.push(
                        this.resizeAndUpsertImage(img, productSkuId, tenantId)
                    );
                });
            }

            return Promise.all(promises);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
        }
    }


    async upsertImageFromRequest(request, index) {
        // request.payload.images and request.payload.alt_test are not arrays if only one image is
        // uploaded, so converting to arrays
        const id = makeArray(request.payload.id)[index];
        const image = makeArray(request.payload.image)[index];

        const upsertData = {
            tenant_id: request.payload.tenant_id,
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
