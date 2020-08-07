const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: CoreService.DB_TABLES.product_sku_images,

        uuid: true,

        hasTimestamps: true,

        softDelete: true,

        // One-to-One relation with Product
        // product_id is the foreign key in this model
        product_sku: function() {
            return this.belongsTo('ProductSku', 'product_sku_id');
        },

        // One-to-One relation with Media
        // media_id is the foreign key in this model
        // media: function() {
        //     return this.hasOne('Media', 'id', 'media_id');
        //     // return this.hasOne('Media');
        //     // return this.belongsTo('Media', 'media_id');
        // },
        media: function() {
            return this.hasOne('Media', 'id', 'media_id');
            // return this.hasOne('Media');
            // return this.belongsTo('Media', 'media_id');
        },

        // tenant_id is not visible
        visible: [
            'id',
            'product_sku_id',
            'media_id',
            'media',
            'published',
            'is_featured',
            'alt_text',
            'ordinal',
            'created_at',
            'updated_at'
        ]
    });
};
