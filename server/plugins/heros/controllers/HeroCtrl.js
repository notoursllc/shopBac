

const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');
const BunnyAPI = require('../../core/services/BunnyAPI');

class HerolCtrl extends BaseController {

    constructor(server) {
        super(server, 'Hero');
    }


    getSchema() {
        return {
            id: Joi.string().uuid().allow(null),
            tenant_id: Joi.string().uuid(),
            published: Joi.boolean().default(true),
            title: Joi.string(),
            caption: Joi.string(),
            ordinal: Joi.number().integer().min(0).allow(null),
            url: Joi.string().max(200).allow(null),
            alt_text: Joi.string().max(100).allow(null),
            metadata: Joi.alternatives().try(Joi.array(), Joi.allow(null)),
            created_at: Joi.date(),
            updated_at: Joi.date(),
            deleted_at: Joi.date()
        };
    }


    async bulkUpdateOrdinals(request, h) {
        try {
            global.logger.info(`REQUEST: HerolCtrl.bulkUpdateOrdinals`);

            const promises = [];
            const tenant_id = this.getTenantIdFromAuth(request);

            request.payload.ordinals.forEach((obj) => {
                promises.push(
                    this.upsertModel({
                        ...obj,
                        tenant_id
                    })
                );
            });

            await Promise.all(promises);

            global.logger.info('RESPONSE: HerolCtrl.bulkUpdateOrdinals');

            return h.apiSuccess();
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async upsertHandler(request, h) {
        try {
            global.logger.info('REQUEST: HerolCtrl.upsertHandler', {
                meta: {
                    payload: request.payload
                }
            });

            if(request.payload.file) {
                request.payload.url = await BunnyAPI.uploadFile(
                    'images',
                    `${Date.now()}-${request.payload.file.filename}`,
                    request.payload.file
                );
            }

            delete request.payload.file;

            const Hero = await this.upsertModel({
                ...request.payload
            });

            global.logger.info('RESONSE: HerolCtrl.imageUpsertHandler', {
                meta: Hero ? Hero.toJSON() : null
            });

            return h.apiSuccess(Hero);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }

}

module.exports = HerolCtrl;





