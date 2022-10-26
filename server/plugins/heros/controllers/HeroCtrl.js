

const Joi = require('joi');
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
                request.payload.url = await BunnyAPI.storage.upload(
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


    async deleteImage(id, tenant_id) {
        global.logger.info('REQUEST: HeroCtrl.deleteImage', {
            meta: { id, tenant_id }
        });

        const Hero = await this.fetchOne({
            id,
            tenant_id
        });

        if(!Hero) {
            throw new Error('Unable to find Hero');
        }

        try {
            const image = Hero.get('url');

            if(image) {
                await BunnyAPI.storage.del(image);
            }

            global.logger.info('RESPONSE: HeroCtrl.deleteImage', {
                meta: { image }
            });

            return image
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw err;
        }
    }

    /**
     * Deletes a ProductArtist, including its image
     *
     * @param {*} request
     * @param {*} h
     */
    async deleteHandler(request, h) {
        try {
            global.logger.info('REQUEST: HeroCtrl.deleteHandler', {
                meta: request.query
            });

            const id = request.query.id;
            const tenant_id = this.getTenantIdFromAuth(request);

            const Hero = await this.fetchOne({
                id,
                tenant_id
            });

            if(!Hero) {
                throw new Error('Unable to find Hero');
            }

            try {
                await this.deleteImage(id, tenant_id);
            }
            catch(err) {
                global.logger.error(err);
                global.bugsnag(err);
            }

            await this.deleteModel(id, tenant_id);

            return h.apiSuccess();
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }

}

module.exports = HerolCtrl;





