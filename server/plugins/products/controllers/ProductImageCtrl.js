const Joi = require('@hapi/joi');
const isObject = require('lodash.isobject');
const BaseController = require('../../core/BaseController');
const StorageService = require('../../core/services/StorageService');
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
        return {
            // images: Joi.alternatives().try(Joi.array().allow(null), Joi.binary().allow(null)),
            id: Joi.alternatives().try(Joi.array(), Joi.allow(null)),
            image: Joi.alternatives().try(Joi.array(), Joi.object().unknown(), Joi.allow(null)),
            alt_text: Joi.alternatives().try( Joi.array(), Joi.string().trim().max(100), Joi.allow(null)),
            ordinal: Joi.alternatives().try( Joi.number().integer().positive(), Joi.allow(null)),
            product_id: Joi.string().uuid().required()
        }
    }


    async upsertImageFromRequest(request, index) {
        // request.payload.images and request.payload.alt_test are not arrays if only one image is
        // uploaded, so converting to arrays
        const id = makeArray(request.payload.id)[index];
        const image = makeArray(request.payload.image)[index];

        const upsertData = {
            tenant_id: this.getTenantId(request),
            product_id: request.payload.product_id,
            published: true,
            alt_text: makeArray(request.payload.alt_text)[index],
            ordinal: makeArray(request.payload.ordinal)[index]
        }

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
                upsertData.variants = storedImages[1];
            }
        }

        return this.upsertModel(upsertData);
    }


    async upsertHandler(request, h) {
        try {
            const promises = [];
            const numImages = makeArray(request.payload.image).length;

            for(let i=0; i<numImages; i++) {
                promises.push(
                    this.upsertImageFromRequest(request, i)
                )
            }

            const ProductImages = await Promise.all(promises);
            return h.apiSuccess(ProductImages);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }
}

module.exports = ProductImageCtrl;
