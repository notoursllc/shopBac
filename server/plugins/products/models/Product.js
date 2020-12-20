const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: DB_TABLES.products,

            uuid: true,

            hasTimestamps: true,

            softDelete: true,

            // tax: function() {
            //     // tax_id is the foreign key in this model
            //     return this.belongsTo('ProductTax', 'tax_id');
            // },

            // package_type: function() {
            //     // tax_id is the foreign key in this model
            //     return this.belongsTo('PackageType', 'shipping_package_type_id');
            // },

            variants: function() {
                // product_id is the foreign key in ProductVariant
                return this.hasMany('ProductVariant', 'product_id');
            },

            // cart_items: function() {
            //     // product_id is the foreign key in CartItem
            //     return this.hasMany('CartItem', 'product_id');
            // },

            format(attributes) {
                if (attributes.metadata) {
                    attributes.metadata = JSON.stringify(attributes.metadata)
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
                //     const skus = this.related('colors').toArray();
                //     if(skus.length) {
                //         skus.forEach(function (model) {
                //             totalCount += model.get('inventory_count')
                //         })
                //     }

                //     return totalCount;
                // }

            },

            visible: [
                'id',
                // 'tenant_id', not visible
                'published',
                'title',
                'caption',
                'description',
                'shippable',
                'metadata',
                'is_good',

                'type',
                'sub_type',
                'sales_channel_type',
                'package_type',
                'vendor_type',
                'collections',
                'gender_type',
                'fit_type',
                'sleeve_length_type',
                'feature_type',

                'seo_page_title',
                'seo_page_desc',
                'seo_uri',
                'video_url',
                'created_at',
                'updated_at',
                // 'deleted_at',  // not visible

                // relations
                'variants',

                // virtuals
                // 'total_inventory_count'
            ]
        }
    );
};
