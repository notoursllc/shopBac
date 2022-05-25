const Joi = require('joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');
const BunnyAPI = require('../../core/services/BunnyAPI');


class ProductArtistCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductArtist');
    }

    getSchema() {
        return {
            tenant_id: Joi.string().uuid(),
            published: Joi.boolean().default(true),
            name: Joi.alternatives().try(
                Joi.string().trim().max(100),
                Joi.allow(null)
            ),
            description: Joi.alternatives().try(
                Joi.string().trim(),
                Joi.allow(null)
            ),
            website: Joi.alternatives().try(
                Joi.string().trim().max(100),
                Joi.allow(null)
            ),
            city: Joi.alternatives().try(
                Joi.string().trim().max(100),
                Joi.allow(null)
            ),
            state: Joi.alternatives().try(
                Joi.string().trim().max(100),
                Joi.allow(null)
            ),
            countryCodeAlpha2: Joi.alternatives().try(
                Joi.string().trim().max(2),
                Joi.allow(null)
            ),
            image: Joi.alternatives().try(
                Joi.string().trim().max(100),
                Joi.allow(null)
            ),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    async deleteImage(id, tenant_id) {
        global.logger.info('REQUEST: ProductArtistCtrl.deleteImage', {
            meta: { id, tenant_id }
        });

        const ProductArtist = await this.fetchOne({
            id,
            tenant_id
        });

        if(!ProductArtist) {
            throw new Error('Unable to find ProductArtist');
        }

        try {
            const image = ProductArtist.get('image');

            if(image) {
                await BunnyAPI.deleteFile(image);
            }

            global.logger.info('RESPONSE: ProductArtistCtrl.deleteImage', {
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


    async deleteImageHandler(request, h) {
        try {
            global.logger.info(`REQUEST: ProductArtistCtrl.deleteImageHandler`, {
                meta: request.query
            });

            const image = await this.deleteImage(
                request.query.id,
                this.getTenantIdFromAuth(request)
            );

            await this.upsertModel({
                id: request.query.id,
                image: null
            });

            global.logger.info('RESPONSE: ProductArtistCtrl.deleteImageHandler', {
                meta: { image }
            });

            return h.apiSuccess({
                image
            });
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
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
            global.logger.info('REQUEST: ProductArtistCtrl.deleteArtist', {
                meta: request.query
            });

            const id = request.query.id;
            const tenant_id = this.getTenantIdFromAuth(request);

            const ProductArtist = await this.fetchOne({
                id,
                tenant_id
            });

            if(!ProductArtist) {
                throw new Error('Unable to find ProductArtist');
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


    async upsertHandler(request, h) {
        try {
            global.logger.info('REQUEST: ProductArtistCtrl.upsertHandler', {
                meta: {
                    payload: request.payload
                }
            });

            if(request.payload.file) {
                request.payload.image = await BunnyAPI.uploadFile(
                    'images',
                    `${Date.now()}-${request.payload.file.filename}`,
                    request.payload.file
                );
            }

            delete request.payload.file;

            const ProductArtist = await this.upsertModel({
                ...request.payload
            });

            global.logger.info('RESONSE: ProductArtistCtrl.upsertHandler', {
                meta: ProductArtist ? ProductArtist.toJSON() : null
            });

            return h.apiSuccess(ProductArtist);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }

}

module.exports = ProductArtistCtrl;
