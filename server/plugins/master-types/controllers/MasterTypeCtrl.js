const Joi = require('@hapi/joi');
const BaseController = require('../../core/controllers/BaseController');


class MasterTypeCtrl extends BaseController {

    constructor(server) {
        super(server, 'MasterType');
    }


    getSchema() {
        return {
            tenant_id: Joi.string().uuid().required(),
            published: Joi.boolean().default(true),
            object: Joi.string().max(100).required(),
            name: Joi.string().max(100).required(),
            value: Joi.number().integer().min(0).required(),
            slug: Joi.string().allow('').allow(null),
            description: Joi.string().max(500).allow('').allow(null),
            metadata: Joi.array().allow(null),
            ordinal: Joi.number().integer().min(0).allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    async bulkUpdateOrdinals(request, h) {
        try {
            global.logger.info(`REQUEST: MasterTypeCtrl.bulkUpdateOrdinals`);

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

            global.logger.info('RESPONSE: MasterTypeCtrl.bulkUpdateOrdinals');

            return h.apiSuccess();
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }

}

module.exports = MasterTypeCtrl;
