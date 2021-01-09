

const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');
const { resizeBufferToMultipleImages } = require('../../core/services/ImageService');


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
            variants: Joi.array().allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date(),
            deleted_at: Joi.date()
        };
    }


    async upsertHandler(request, h) {
        try {
            const tenant_id = this.getTenantIdFromAuth(request);

            global.logger.info('REQUEST: MediaCtrl.upsertHandler', {
                meta: {
                    tenant_id: tenant_id,
                    file: request.payload.file ? true : false
                }
            });

            const Media = await this.resizeAndUpsertImage(
                request.payload.file,
                tenant_id
            );

            global.logger.info('RESONSE: MediaCtrl.upsertHandler', {
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
                    { width: 1200 },
                    { width: 600 },
                    { width: 75 }
                ],
                true
            )
        );

        return this.upsertModel({
            tenant_id: tenantId,
            resource_type: 'IMAGE',
            alt_text: null,
            ordinal: 0,
            variants: Array.isArray(resizeResults) ? resizeResults : []
        });
    }


}

module.exports = MediaCtrl;





