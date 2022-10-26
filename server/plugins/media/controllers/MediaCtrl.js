

const Joi = require('joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');
// const { resizeBufferToMultipleImages } = require('../../core/services/ImageService');
const BunnyAPI = require('../../core/services/BunnyAPI');
const isObject = require('lodash.isobject');
const uuidV4 = require('uuid/v4');

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
                    // file: request.payload.file ? true : false
                }
            });

            const url = await BunnyAPI.storage.upload(
                'images',
                `${Date.now()}-${request.payload.file.filename}`,
                request.payload.file
            );

            const Media = await this.upsertModel({
                tenant_id: tenant_id,
                resource_type: 'IMAGE',
                alt_text: null,
                ordinal: 0,
                url: url
                // third_party_id: isObject(res) ? res.id : null
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


    async videoUpsertHandler(request, h) {
        try {
            const tenant_id = this.getTenantIdFromAuth(request);

            global.logger.info('REQUEST: MediaCtrl.videoUpsertHandler', {
                meta: {
                    tenant_id: tenant_id,
                    // file: request.payload.file ? true : false
                }
            });

            const res = await BunnyAPI.video.upload(
                request.payload.file.path,
                `${Date.now()}-${request.payload.file.filename}`
            );

            const Media = await this.upsertModel({
                tenant_id: tenant_id,
                resource_type: 'VIDEO',
                alt_text: null,
                ordinal: 0,
                url: res?.directPlayUrl,
                third_party_id: res?.id
            });

            const json = {
                ...(Media ? Media.toJSON() : {}),
                streamLibraryId: process.env.BUNNY_API_STREAM_LIBRARY_ID
            }

            global.logger.info('RESONSE: MediaCtrl.videoUpsertHandler', {
                meta: json
            });

            return h.apiSuccess(json);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    };


    async videoDelete(id, tenant_id, options) {
        const Video = await this.fetchOneForTenant(
            tenant_id,
            { id: id }
        );

        if(Video) {
            await BunnyAPI.video.del(Video.get('third_party_id'));
            return this.deleteModel(id, tenant_id, options)
        }
    };


    async videoDeleteHandler(request, h) {
        try {
            const tenant_id = this.getTenantIdFromAuth(request);

            global.logger.info('REQUEST: MediaCtrl.videoDeleteHandler', {
                meta: request.query
            });

            await this.videoDelete(request.query.id, tenant_id)

            global.logger.info('RESONSE: MediaCtrl.videoDeleteHandler', {
                meta: {
                    id: request.query.id
                }
            });

            return h.apiSuccess(request.query.id);
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





