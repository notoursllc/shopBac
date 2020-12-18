const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.product_variant_skus,

        uuid: true,

        hasTimestamps: true,

        softDelete: true,

        // One-to-One relation with ProductVariant
        // product_variant_id is the foreign key in this model
        product_variant: function() {
            return this.belongsTo('ProductVariant', 'product_variant_id');
        },

        visible: [
            'id',
            // 'tenant_id'  not visible
            'product_variant_id',
            'published',
            'ordinal',
            'label',
            'sku',
            'barcode',
            'base_price',
            'compare_at_price',
            'cost_price',
            'sale_price',
            'is_on_sale',
            'weight_oz',
            'customs_country_of_origin',
            'inventory_count',
            'track_inventory_count',
            'visible_if_no_inventory',
            'is_displayable', // TODO
            'created_at',
            'updated_at',
            // 'deleted_at',  // not visible
        ]
    });
};
