const Joi = require('@hapi/joi');
const BaseController = require('../../core/BaseController');

class ProductCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductVariant');
    }


    getSchema() {
        return {
            published: Joi.boolean().default(false),

            // PRICING
            base_price: Joi.number().precision(2).min(0).max(99999999.99).allow(null),
            sale_price: Joi.number().precision(2).min(0).max(99999999.99).allow(null),
            is_on_sale: Joi.boolean().default(false),
            cost: Joi.number().precision(2).min(0).max(99999999.99).allow(null),
            is_taxable: Joi.boolean().default(true),
            tax_code: Joi.number().allow(null),

            // INVENTORY
            inventory_count: Joi.number().allow(null),
            sku: Joi.string().allow(null),
            barcode: Joi.string().allow(null),
            hide_if_out_of_stock: Joi.boolean().default(true),
            track_quantity: Joi.boolean().default(true),

            // SHIPPING
            weight_oz: Joi.number().precision(2).min(0).max(99999999.99).allow(null),
            customs_country_of_origin: Joi.string().max(2).allow(null),
            customs_harmonized_system_code: Joi.number().allow(null),

            product_id: Joi.string().uuid().required(),

            // TIMESTAMPS
            created_at: Joi.date().optional(),
            updated_at: Joi.date().optional()
        };
    }


    getWithRelated(opts, details) {
        let options = opts || {};
        let related = [
            // {
            //     pics: (query) => {
            //         if(!options.viewAllRelated) {
            //             query.where('published', '=', true);
            //         }
            //         query.orderBy('ordinal', 'ASC');
            //     }
            // }
        ];

        if(details) {
            related.push(
                'product',
                'product.option_labels',
                'product_option_values'
                // 'pics.pic_variants',
            );
        }

        return related;
    }



    async getByIdHandler(request, h) {
        return super.getByIdHandler(
            request.query.id,
            { withRelated: this.getWithRelated(request.query, true) },
            h
        );
    }

}

module.exports = ProductCtrl;
