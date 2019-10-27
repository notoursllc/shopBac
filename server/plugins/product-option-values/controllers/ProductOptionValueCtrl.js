const Joi = require('@hapi/joi');
const BaseController = require('../../core/BaseController');


class ProductOptionValueCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductOptionValue');
    }


    getSchema() {
        return {
            value: Joi.string().max(100).required(),
            product_variant_id: Joi.string().uuid().required(),
            product_option_label_id: Joi.string().uuid().required()
        };
    }

}

module.exports = ProductOptionValueCtrl;
