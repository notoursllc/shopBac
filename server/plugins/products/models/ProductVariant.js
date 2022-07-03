const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: DB_TABLES.product_variants,

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
