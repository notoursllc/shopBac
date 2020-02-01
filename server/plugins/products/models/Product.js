const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: CoreService.DB_TABLES.products,

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

            images: function() {
                // product_id is the foreign key in ProductImage
                return this.hasMany('ProductImage', 'product_id');
            },

            skus: function() {
                // product_id is the foreign key in ProductSku
                return this.hasMany('ProductSku', 'product_id');
            },

            // cart_items: function() {
            //     // product_id is the foreign key in ShoppingCartItem
            //     return this.hasMany('ShoppingCartItem', 'product_id');
            // },


            format(attributes) {
                if (attributes.metadata) {
                    attributes.metadata = JSON.stringify(attributes.metadata)
                }

                if (attributes.attributes) {
                    attributes.attributes = JSON.stringify(attributes.attributes)
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

                total_inventory_count: function() {
                    let totalCount = 0;

                    // https://bookshelfjs.org/api.html#Collection-instance-toArray
                    const skus = this.related('skus').toArray();
                    if(skus.length) {
                        skus.forEach(function (model) {
                            totalCount += model.get('inventory_count')
                        })
                    }

                    return totalCount;
                }

            },


            // tenant_id is not visible
            visible: [
                'id',
                'published',
                'title',
                'caption',
                'description',
                'shippable',
                'attributes',
                'metadata',
                'is_good',
                'type',
                'sub_type',
                'fit_type',
                'sales_channel_type',
                'package_type',
                'vendor_type',
                'collections',
                'seo_page_title',
                'seo_page_desc',
                'seo_uri',
                'video_url',
                'created_at',
                'updated_at',
                // 'deleted_at',

                // relations
                'skus',
                'images',

                // virtuals
                'total_inventory_count'
            ]
        }
    );
};
