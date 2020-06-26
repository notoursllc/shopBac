const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const uuidV4 = require('uuid/v4');
const BaseController = require('../../core/BaseController');
const StorageService = require('../../core/services/StorageService');
const { resizeBase64 } = require('../../core/services/ImageService');


class ProductImageCtrl extends BaseController {

    constructor(server, modelName) {
        super(server, modelName || 'ProductImage');
    }


    getSchema() {
        return {
            id: Joi.string().uuid().allow(null),
            // product_id: Joi.string().uuid().required(),
            product_id: Joi.string().uuid(),
            published: Joi.boolean().default(false),
            image_url: Joi.string().allow(null),
            // image_url: Joi.string().max(200).allow(null),
            alt_text: Joi.string().max(100).allow(null),
            width: Joi.number().integer().min(0).allow(null),
            variants: Joi.array().allow(null),
            ordinal: Joi.number().integer().min(0).allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date(),
            deleted_at: Joi.date()
        };
    }


    getUploadSchema() {
        return Joi.array().items(
            Joi.object({
                id: Joi.string().uuid().allow(null),
                alt_text: Joi.string().trim().max(100).allow(null),
                image_url: Joi.string().required(),
                tenant_id: Joi.string().uuid().required(),
                ordinal: Joi.number().integer().min(0).allow(null),
                product_id: Joi.string().uuid().required()
            })
        ).min(1).required();
    }


    async resizeAndUpsertImage(image, productId, tenantId) {
        global.logger.info(`REQUEST: ProductImageCtrl.upsertImage (${this.modelName})`, {
            meta: {
                productId,
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
            product_id: productId,
            tenant_id: tenantId,
            width: resizeResults[0].width,
            image_url: resizeResults[0].image_url,
            alt_text: image.alt_text,
            ordinal: image.ordinal,
            published: true,
            variants: resizeResults.filter((obj, index) => index > 0)
        });
    }


    upsertImages(images, productId, tenantId) {
        try {
            const promises = [];

            global.logger.info(`REQUEST: ProductImageCtrl.upsertImages (${this.modelName})`, {
                meta: {
                    productId,
                    tenantId,
                    images
                }
            });

            if(Array.isArray(images)) {
                images.forEach((img) => {
                    promises.push(
                        this.resizeAndUpsertImage(img, productId, tenantId)
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

    // async upsertHandler(request, h) {
    //     try {
    //         // console.log("REQUEST PAYLOAD", request.payload);
    //         if(Array.isArray(request.payload)) {
    //             for(let i=0, l=request.payload.length; i<l; i++) {
    //                 const payloadObj = request.payload[i];

    //                 const results = await Promise.all([
    //                     this.resizeAndStoreBase64(payloadObj.image_url, { width: 600 }),
    //                     this.resizeAndStoreBase64(payloadObj.image_url, { width: 1000 }),
    //                     this.resizeAndStoreBase64(payloadObj.image_url, { width: 75 })
    //                 ]);

    //                 this.upsertModel({
    //                     ...results[0],
    //                     product_id: payloadObj.product_id,
    //                     alt_text: payloadObj.alt_text,
    //                     ordinal: payloadObj.ordinal,
    //                     tenant_id: payloadObj.tenant_id,
    //                     published: true,
    //                     variants: results.filter((obj, index) => index > 0)
    //                 });
    //             }
    //         }

    //         return h.apiSuccess();
    //     }
    //     catch(err) {
    //         global.logger.error(err);
    //         global.bugsnag(err);
    //         throw Boom.badRequest(err);
    //     }
    // }
}

module.exports = ProductImageCtrl;
