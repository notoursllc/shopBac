const Joi = require('@hapi/joi');
const BaseController = require('../../core/BaseController');


class ProductOptionLabelCtrl extends BaseController {

    constructor(server) {
        super(server, 'ProductOptionLabel');
    }


    getSchema() {
        return {
            label: Joi.string().max(100).required(),
            product_id: Joi.string().uuid().required(),
            created_at: Joi.date(),
            updated_at: Joi.date()
        };
    }


    async getLabelsForProduct(productId) {
        global.logger.info('REQUEST: ProductOptionLabelCtrl.getLabelsForProduct');

        const Models = this.fetchAll((qb) => {
            qb.where('product_id', '=', productId);
        })

        global.logger.info('RESPONSE: ProductOptionLabelCtrl.getLabelsForProduct', {
            meta: Models ? Models.toJSON() : null
        });

        return Models;
    }

}

module.exports = ProductOptionLabelCtrl;
