const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: DB_TABLES.product_variants,

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

            format(attributes) {
                if (attributes.images) {
                    attributes.images = JSON.stringify(attributes.images)
                }

                if (attributes.swatches) {
                    attributes.swatches = JSON.stringify(attributes.swatches)
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

                display_price: function() {
                    const sale_price = this.get('sale_price');

                    if(this.get('is_on_sale') && sale_price !== null) {
                        return sale_price;
                    }

                    return this.get('base_price');
                },

                total_inventory_count: function() {
                    let totalCount = 0;

                    // https://bookshelfjs.org/api.html#Collection-instance-toArray
                    const skus = this.related('skus').toArray();
                    if(skus.length) {
                        skus.forEach((model) => {
                            totalCount += model.get('inventory_count')
                        })
                    }

                    return totalCount;
                }
            },

            hidden: [
                'tenant_id',
                'deleted_at'
            ]
        }
    );
};
