const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: CoreService.DB_TABLES.product_images,

        uuid: true,

        hasTimestamps: true,

        softDelete: true,

        // One-to-One relation with Product
        // product_id is the foreign key in this model
        product: function() {
            return this.belongsTo('Product', 'product_id');
        },


        format(attributes) {
            if (attributes.variants) {
                attributes.variants = JSON.stringify(attributes.variants)
            }

            return attributes;
        },

        // tenant_id is not visible
        visible: [
            'id',
            'product_id',
            'published',
            'image_url',
            'alt_text',
            'width',
            'variants',
            'ordinal',
            'created_at',
            'updated_at'
        ]
    });
};
