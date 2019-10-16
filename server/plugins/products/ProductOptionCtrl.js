const Joi = require('@hapi/joi');
const BaseController = require('../core/BaseController');


class ProductOptionCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductOption');
    }


    getSchema() {
        return {
            product_variation_id: Joi.string().guid({
                version: [
                    'uuidv4',
                    'uuidv5'
                ]
            }).required(),
            type: Joi.string().max(100).required(),
            name: Joi.string().max(100).required(),
            ordinal: Joi.number().integer().min(1),
            sku: Joi.string(),
            published: Joi.boolean().default(true),
            inventory_alert_threshold: Joi.number().integer(),
            inventory_alert_show: Joi.boolean().default(true),
            inventory_count: Joi.number().integer(),
            weight_oz: Joi.number().precision(2).min(0).max(99999999.99).allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    async getOptionsForProductVariationHandler(productVariationId, h) {
        return this.fetchAll(h, (qb) => {
            qb.where('product_variation_id', '=', productVariationId);
        });
    }

}

module.exports = ProductOptionCtrl;
