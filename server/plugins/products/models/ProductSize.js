const Joi = require('@hapi/joi');
const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: CoreService.DB_TABLES.product_sizes,

        uuid: true,

        hasTimestamps: true,

        // http://bookshelfjs.org/#Model-instance-belongsTo
        // product_id is the foreign key in this model
        product: function() {
            return this.belongsTo('Product', 'product_id');
        },

        validate: {
            size: Joi.string().max(100),
            sort: Joi.number().integer().min(0).allow(null),
            cost: Joi.number().precision(2).max(99999999.99).allow(null),
            base_price: Joi.number().precision(2).max(99999999.99).allow(null),
            sale_price: Joi.number().precision(2).max(99999999.99).allow(null),
            is_on_sale: Joi.boolean().default(false),
            is_visible: Joi.boolean().default(false),
            inventory_count: Joi.number().integer().min(0).allow(null),
            product_id: Joi.string().uuid(),
            weight_oz: Joi.number().precision(1).max(99999999.9).min(0).allow(null)
        }
    });
};
