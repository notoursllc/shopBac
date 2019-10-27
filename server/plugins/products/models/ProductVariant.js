const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: CoreService.DB_TABLES.product_variants,

            uuid: true,

            hasTimestamps: true,

            // One-to-One relation with Product
            // product_id is the foreign key in this model
            product: function() {
                return this.belongsTo('Product', 'product_id');
            },

            option_values: function() {
                // product_variation_id is the foreign key in ProductOptionValues
                return this.hasMany('ProductOptionValues', 'product_variant_id');
            },

            // pics: function() {
            //     // product_variation_id is the foreign key in ProductPic
            //     return this.hasMany('ProductPic', 'product_variation_id');
            // }
        },

        // Custom methods:
        {

        }
    );
};
