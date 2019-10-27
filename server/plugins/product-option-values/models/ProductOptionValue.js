const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: CoreService.DB_TABLES.product_option_values,

            uuid: true,

            hasTimestamps: false,

            variant: function() {
                // product_variant_id is the foreign key in this model
                return this.belongsTo('ProductVariant', 'product_variant_id');
            },

            product_option_label: function() {
                // product_option_label_id is the foreign key in this model
                return this.belongsTo('ProductOptionLabel', 'product_option_label_id');
            },
        },

        // Custom methods:
        {

        }
    );
};
