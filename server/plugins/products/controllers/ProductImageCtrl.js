const Joi = require('@hapi/joi');
const BaseController = require('../../core/BaseController');
const { resizeBase64ToMultipleImages } = require('../../core/services/ImageService');


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
            is_featured: Joi.boolean().default(false),
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
        global.logger.info(`REQUEST: ProductImageCtrl.resizeAndUpsertImage (${this.modelName})`, {
            meta: {
                tenantId,
                productId,
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
            product_id: productId,
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


    upsertImages(images, productId, tenantId) {
        try {
            const promises = [];

            global.logger.info(`REQUEST: ProductImageCtrl.upsertImages (${this.modelName})`, {
                meta: {
                    tenantId,
                    productId,
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

            global.logger.info(`RESPONSE: ProductImageCtrl.upsertImages (${this.modelName}) - returning ${promises.length} promises`);

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
