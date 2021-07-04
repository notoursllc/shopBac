

const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');


class PackageTypeCtrl extends BaseController {

    constructor(server) {
        super(server, 'PackageType');
    }


    getSchema() {
        return {
            id: Joi.string().uuid().allow(null),
            tenant_id: Joi.string().uuid(),
            label: Joi.string().max(100).allow(null),
            description: Joi.alternatives().try(Joi.string().trim().max(500), Joi.allow(null)),
            code: Joi.string().max(100).allow(null),
            code_for_carrier: Joi.string().max(100).allow(null),
            length_cm: Joi.number().integer().min(0).allow(null),
            width_cm: Joi.number().integer().min(0).allow(null),
            height_cm: Joi.number().integer().min(0).allow(null),
            weight_oz: Joi.number().integer().min(0).allow(null),
            max_weight_oz: Joi.number().integer().min(0).allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date(),
            deleted_at: Joi.date()
        };
    }

}

module.exports = PackageTypeCtrl;





