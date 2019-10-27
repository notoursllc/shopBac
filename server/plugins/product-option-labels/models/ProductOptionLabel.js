const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: CoreService.DB_TABLES.product_option_labels,

            uuid: true,

            hasTimestamps: false,

            // One-to-One relation with Product
            // product_id is the foreign key in this model
            product: function() {
                return this.belongsTo('Product', 'product_id');
            },

            product_option_values: function() {
                // product_option_label_id is the foreign key in ProductOptionValue
                return this.hasMany('ProductOptionValue', 'product_option_label_id');
            },
        },

        // Custom methods:
        {

        }
    );
};
