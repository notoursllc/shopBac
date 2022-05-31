const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: DB_TABLES.products,

            // tax: function() {
            //     // tax_id is the foreign key in this model
            //     return this.belongsTo('ProductTax', 'tax_id');
            // },

            // package_type: function() {
            //     // tax_id is the foreign key in this model
            //     return this.belongsTo('PackageType', 'shipping_package_type_id');
            // },

            artist: function() {
                // product_artist_id is the foreign key in this model
                return this.belongsTo('ProductArtist', 'product_artist_id');
            },

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

                total_inventory_count: function() {
                    let totalCount = 0;

                    // https://bookshelfjs.org/api.html#Collection-instance-toArray
                    const variants = this.related('variants').toArray();
                    if(variants.length) {
                        variants.forEach((model) => {
                            totalCount += model.get('total_inventory_count')
                        })
                    }

                    return totalCount;
                },

                packing_volume_cm: function() {
                    return (this.get('packing_length_cm') || 0)
                        * (this.get('packing_width_cm') || 0)
                        * (this.get('packing_height_cm') || 0);
                }
            },


            hidden: [
                'tenant_id',
                'deleted_at'
            ]
        }
    );
};
