const Joi = require('@hapi/joi');
const BaseController = require('../../core/controllers/BaseController');


class MasterTypeCtrl extends BaseController {

    constructor(server) {
        super(server, 'MasterType');
    }


    getSchema() {
        return {
            tenant_id: Joi.string().uuid(),
            published: Joi.boolean().default(true),
            object: Joi.string().max(100).required(),
            name: Joi.string().max(100).required(),
            value: Joi.number().integer().min(0).required(),
            slug: Joi.string().allow('').allow(null),
            description: Joi.string().max(500).allow('').allow(null),
            metadata: Joi.array().allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }

}

module.exports = MasterTypeCtrl;
