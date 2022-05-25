const Joi = require('joi');
const BaseController = require('../../core/controllers/BaseController');


class ProductAccentMessageCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductAccentMessage');
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

module.exports = ProductAccentMessageCtrl;
