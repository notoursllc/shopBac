const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: CoreService.DB_TABLES.product_pics,

            uuid: true,

            hasTimestamps: true,

            // One-to-One relation with Product
            // product_variation_id is the foreign key in this model
            variation: function() {
                return this.belongsTo('ProductVariation', 'product_variation_id');
            },

            pic_variants: function() {
                // product_pic_id is the foreign key in ProductPicVariant
                return this.hasMany('ProductPicVariant', 'product_pic_id');
            }
        },

        // Custom methods:
        {

        }
    );
};
