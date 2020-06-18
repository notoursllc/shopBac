const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const isObject = require('lodash.isobject');
const cloneDeep = require('lodash.clonedeep');
const Jimp = require('jimp');
const FileType = require('file-type');
const uuidV4 = require('uuid/v4');
const BaseController = require('../../core/BaseController');
const StorageService = require('../../core/services/StorageService');
const { resizeBase64 } = require('../../core/services/ImageService');
const { makeArray } = require('../../../helpers.service');


class ProductImageCtrl extends BaseController {

    constructor(server, modelName) {
        super(server, modelName || 'ProductImage');
    }


    // getSchema() {
    //     return {
    //         product_id: Joi.string().uuid().required(),
    //         published: Joi.boolean().default(false),
    //         image_url: Joi.string().max(200).allow(null),
    //         alt_text: Joi.string().max(100).allow(null),
    //         width: Joi.number().integer().min(0).allow(null),
    //         variants: Joi.array().allow(null),
    //         ordinal: Joi.number().integer().min(0).allow(null),
    //         created_at: Joi.date().optional(),
    //         updated_at: Joi.date().optional(),
    //         deleted_at: Joi.date().optional()
    //     };
    // }


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


    // async upsertImage(data) {
    //     // request.payload.images and request.payload.alt_test are not arrays if only one image is
    //     // uploaded, so converting to arrays
    //     const id = makeArray(request.payload.id)[index];
    //     const image = makeArray(request.payload.image)[index];

    //     const upsertData = {
    //         tenant_id: request.payload.tenant_id,
    //         product_id: request.payload.product_id,
    //         published: true,
    //         alt_text: makeArray(request.payload.alt_text)[index],
    //         ordinal: makeArray(request.payload.ordinal)[index]
    //     };

    //     if(id) {
    //         upsertData.id = id;
    //     }

    //     if(isObject(image)) {
    //         const storedImages = await Promise.all([
    //             StorageService.resizeAndWrite(image, 600),
    //             StorageService.resizeAndWrite(image, 1000)
    //         ]);

    //         if(Array.isArray(storedImages) && storedImages.length) {
    //             upsertData.image_url = storedImages[0].url;
    //             upsertData.width = storedImages[0].width;
    //             upsertData.variants = [storedImages[1]];
    //         }
    //     }

    //     return this.upsertModel(upsertData);
    // }


    async resizeAndStoreBase64(b64, options) {
        try {
            const imageResult = await resizeBase64(b64, options);
            const storageResult = await StorageService.writeBuffer(imageResult.result, `${uuidV4()}.${imageResult.ext}`);

            return {
                width: imageResult.width,
                image_url: storageResult
            };
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw err;
        }
    }


    async upsertHandler(request, h) {
        try {
            // console.log("REQUEST PAYLOAD", request.payload);
            if(Array.isArray(request.payload)) {
                for(let i=0, l=request.payload.length; i<l; i++) {
                    const payloadObj = request.payload[i];

                    const results = await Promise.all([
                        this.resizeAndStoreBase64(payloadObj.image_url, { width: 600 }),
                        this.resizeAndStoreBase64(payloadObj.image_url, { width: 1000 }),
                        this.resizeAndStoreBase64(payloadObj.image_url, { width: 75 })
                    ]);

                    this.upsertModel({
                        ...results[0],
                        product_id: payloadObj.product_id,
                        alt_text: payloadObj.alt_text,
                        ordinal: payloadObj.ordinal,
                        tenant_id: payloadObj.tenant_id,
                        published: true,
                        variants: results.filter((obj, index) => index > 0)
                    });
                }
            }

            return h.apiSuccess();
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }
}

module.exports = ProductImageCtrl;
