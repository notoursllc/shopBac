const Joi = require('@hapi/joi');
const BaseController = require('../../core/BaseController');


class ProductSkuAccentMessageCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductSkuAccentMessage');
    }


    getSchema() {
        return {
            tenant_id: Joi.string().uuid(),
            message: Joi.string().max(100).required(),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }

}

module.exports = ProductSkuAccentMessageCtrl;
