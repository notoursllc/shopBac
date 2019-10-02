const Joi = require('@hapi/joi');
const BaseController = require('./BaseController');


class ProductVariationCtrl extends BaseController {

    constructor(server, modelName) {
        super(server, modelName);
    }


    getSchema() {
        return {
            product_id: Joi.string().guid({
                version: [
                    'uuidv4',
                    'uuidv5'
                ]
            }).required(),
            name: Joi.string().max(100).required(),
            description: Joi.string().max(500).allow(null),
            ordinal: Joi.number().integer().min(1),
            sku: Joi.string(),
            published: Joi.boolean().default(true),
            inventory_alert_threshold: Joi.number().integer(),
            inventory_alert_show: Joi.boolean().default(true),
            inventory_count: Joi.number().integer(),
            hide_if_out_of_stock: Joi.boolean().default(true),
            weight_oz: Joi.number().precision(2).min(0).max(99999999.99).allow(null),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    getWithRelated() {
        return [
            {
                options: (query) => {
                    query.where('published', '=', true);
                    query.orderBy('ordinal', 'ASC');
                }
            }
        ]
    }


    async getVariationByIdHandler(request, h) {
        return this.getByIdHandler(
            request.query.id,
            { withRelated: this.getWithRelated() },
            h
        );
    }


    async getVariationsForProductHandler(productId, h) {
        return this.fetchAll(h, (qb) => {
            qb.where('product_id', '=', productId);
        });
    }

}

module.exports = ProductVariationCtrl;
