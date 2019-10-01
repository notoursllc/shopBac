const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: CoreService.DB_TABLES.product_options,

            uuid: true,

            hasTimestamps: true,

            // One-to-One relation with ProductVariation
            // product_variation_id is the foreign key in this model
            product_variation: function() {
                return this.belongsTo('ProductVariation', 'product_variation_id');
            }
        },

        // Custom methods:
        {

        }
    );
};
