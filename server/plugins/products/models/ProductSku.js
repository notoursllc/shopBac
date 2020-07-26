const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: CoreService.DB_TABLES.product_skus,

        uuid: true,

        hasTimestamps: true,

        softDelete: true,

        // One-to-One relation with Product
        // product_id is the foreign key in this model
        product: function() {
            return this.belongsTo('Product', 'product_id');
        },

        // One-to-One relation with Product
        // spec_table_id is the foreign key in this model
        productSpecTable: function() {
            return this.belongsTo('ProductSpecTable', 'spec_table_id');
        },

        images: function() {
            // product_sku_id is the foreign key in ProductSkuImage
            return this.hasMany('ProductSkuImage', 'product_sku_id');
        },

        format(attributes) {
            if (attributes.attributes) {
                attributes.attributes = JSON.stringify(attributes.attributes);
            }

            return attributes;
        },

        virtuals: {
            is_displayable: function() {
                const inventory_count = this.get('inventory_count');
                return (this.get('published') && (inventory_count || (!inventory_count && this.get('visible_if_out_of_stock'))));
            }
        },

        // not visible: tenant_id, deleted_at
        visible: [
            'id',
            'product_id',
            'published',
            'attributes',
            'metadata',
            'ordinal',
            'currency',
            'base_price',
            'cost_price',
            'compare_at_price',
            'sale_price',
            'is_on_sale',
            'is_taxable',
            'is_displayable',
            'tax_code',
            'inventory_count',
            'sku',
            'barcode',
            'visible_if_out_of_stock',
            'track_quantity',
            'weight_oz',
            'customs_country_of_origin',
            'customs_harmonized_system_code',
            'spec_table_id',
            'spec_table_data',
            'created_at',
            'updated_at',

            // relations
            'images'
        ]
    });
};
