const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: CoreService.DB_TABLES.product_option_values,

            uuid: true,

            hasTimestamps: true,

            // One-to-One relation with ProductVariant
            // product_variant_id is the foreign key in this model
            variant: function() {
                return this.belongsTo('ProductVariant', 'product_variant_id');
            },

            // One-to-One relation with ProductOption
            // product_option_id is the foreign key in this model
            option: function() {
                return this.belongsTo('ProductOptionm', 'product_option_id');
            }
        },

        // Custom methods:
        {

        }
    );
};
