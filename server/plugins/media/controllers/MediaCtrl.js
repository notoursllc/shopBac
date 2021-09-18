

const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');
// const { resizeBufferToMultipleImages } = require('../../core/services/ImageService');
const { postImage } = require('../../core/services/CloudflareAPI');
const isObject = require('lodash.isobject');

class MediaCtrl extends BaseController {

    constructor(server) {
        super(server, 'Media');
    }


    getSchema() {
        return {
            id: Joi.string().uuid().allow(null),
            tenant_id: Joi.string().uuid(),
            resource_type: Joi.string().required(),
            alt_text: Joi.string().max(100).allow(null),
            ordinal: Joi.number().integer().min(0).allow(null),
            url: Joi.string().max(200).allow(null),
            third_party_id: Joi.string().max(200).allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date(),
            deleted_at: Joi.date()
        };
    }


    async imageUpsertHandler(request, h) {
        try {
            const tenant_id = this.getTenantIdFromAuth(request);

            global.logger.info('REQUEST: MediaCtrl.imageUpsertHandler', {
                meta: {
                    tenant_id: tenant_id,
                    file: request.payload.file ? true : false
                }
            });

            const res = await postImage(request.payload.file);

            const Media = await this.upsertModel({
                tenant_id: tenant_id,
                resource_type: 'IMAGE',
                alt_text: null,
                ordinal: 0,
                third_party_id: isObject(res) ? res.id : null
            });

            global.logger.info('RESONSE: MediaCtrl.imageUpsertHandler', {
                meta: Media ? Media.toJSON() : null
            });

            return h.apiSuccess(Media);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    };


    /*
    async resizeAndUpsertImage(File, tenantId) {
        global.logger.info(`REQUEST: MediaCtrl.resizeAndUpsertImage (${this.modelName})`, {
            meta: {
                tenantId
            }
        });

        const resizeResults = await Promise.all(
            resizeBufferToMultipleImages(
                File._data,
                [
                    { width: 1200 }
                ],
                true
            )
        );

        const modelData = {
            tenant_id: tenantId,
            resource_type: 'IMAGE',
            alt_text: null,
            ordinal: 0
        }

        if(Array.isArray(resizeResults)) {
            modelData.url = resizeResults[0].url;
            modelData.width = resizeResults[0].width;
            modelData.height = resizeResults[0].height;
            modelData.mime = resizeResults[0].mime;
        }

        return this.upsertModel(modelData);
    }
    */

}

module.exports = MediaCtrl;





