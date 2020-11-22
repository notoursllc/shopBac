const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: CoreService.DB_TABLES.product_variant_skus,

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
            'base_price_inherit',
            'compare_at_price',
            'compare_at_price_inherit',
            'cost_price',
            'cost_price_inherit',
            'sale_price',
            'sale_price_inherit',
            'is_on_sale',
            'is_on_sale_inherit',
            'weight_oz',
            'weight_oz_inherit',
            'customs_country_of_origin',
            'customs_country_of_origin_inherit',
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
