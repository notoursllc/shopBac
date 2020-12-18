const Joi = require('@hapi/joi');
const BaseController = require('../../core/controllers/BaseController');


class ProductDataTableCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductDataTable');
    }


    getSchema() {
        return {
            tenant_id: Joi.string().uuid(),
            name: Joi.string().max(100).required(),
            table_data: Joi.object().allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }

}

module.exports = ProductDataTableCtrl;
