const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: CoreService.DB_TABLES.product_variants,

        uuid: true,

        hasTimestamps: true,

        softDelete: true,

        // One-to-One relation with Product
        // product_id is the foreign key in this model
        product: function() {
            return this.belongsTo('Product', 'product_id');
        },

        skus: function() {
            // product_variant_id is the foreign key in ProductVariantSku
            return this.hasMany('ProductVariantSku', 'product_variant_id');
        },

        // images: function() {
        //     // product_variant_id is the foreign key in ProductVariantImage
        //     return this.hasMany('ProductVariantImage', 'product_variant_id');
        // },

        format(attributes) {
            if (attributes.exhibits) {
                attributes.exhibits = JSON.stringify(attributes.exhibits)
            }

            return attributes;
        },

        virtuals: {
            // display_price: function() {
            //     let price = 0;
            //     let salePrice = this.get('sale_price') || 0;
            //     let basePrice = this.get('base_price') || 0;

            //     if(this.get('is_on_sale') && salePrice) {
            //         price = salePrice;
            //     }
            //     else if(basePrice) {
            //         price = basePrice;
            //     }

            //     return price;
            // },

            // total_inventory_count: function() {
            //     let totalCount = 0;

            //     // https://bookshelfjs.org/api.html#Collection-instance-toArray
            //     const sizes = this.related('sizes').toArray();
            //     if(sizes.length) {
            //         sizes.forEach(function (model) {
            //             totalCount += model.get('inventory_count')
            //         })
            //     }

            //     return totalCount;
            // }
        },

        // not visible: tenant_id, deleted_at
        visible: [
            'id',
            'product_id',
            'published',
            'ordinal',
            'label',
            'currency',
            'base_price',
            'cost_price',
            'compare_at_price',
            'sale_price',
            'is_on_sale',
            'is_taxable',
            'tax_code',
            'accent_message_id',
            'accent_message_begin',
            'accent_message_end',
            'exhibitType',
            'exhibits',
            'requires_shipping',
            'weight_oz',
            'customs_country_of_origin',
            'customs_harmonized_system_code',
            'created_at',
            'updated_at',

            // relations
            'skus',
            // 'images',

            // virtuals
            // 'total_inventory_count'
        ]
    });
};
