

const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/BaseController');
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
            url: Joi.string().allow(null),
            width: Joi.number().integer().min(0).allow(null),
            variants: Joi.array().allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date(),
            deleted_at: Joi.date()
        };
    }


    getByIdHandler(request, h) {
        return this.modelForgeFetchHandler(
            {
                id: request.query.id,
                tenant_id: this.getTenantIdFromAuth(request)
            },
            null,
            h
        );
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
                    // { width: 600 },
                    // { width: 1000 },
                    { width: 1800 },
                    { width: 75 }
                ],
                true
            )
        );

        console.log("RESIZE RESULTS", resizeResults);

        const upsertData = {
            tenant_id: tenantId,
            resource_type: 'IMAGE'
        };

        if(resizeResults[0]) {
            upsertData.width = resizeResults[0].width;
            upsertData.url = resizeResults[0].url;
            upsertData.variants = resizeResults.filter((obj, index) => index > 0); // remove the first one because we just used it above
        }

        return this.upsertModel(upsertData);
    }


}

module.exports = MediaCtrl;





