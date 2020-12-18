const Joi = require('@hapi/joi');
const BaseController = require('../../core/controllers/BaseController');


class ProductColorSwatchCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductColorSwatch');
    }


    getSchema() {
        return {
            tenant_id: Joi.string().uuid(),
            hex: Joi.string().max(10).required(),
            label: Joi.string().max(50).required(),
            description: Joi.alternatives().try(Joi.string().max(255), Joi.allow(null)),
            metadata: Joi.alternatives().try(Joi.array(), Joi.allow(null)),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }

}

module.exports = ProductColorSwatchCtrl;
