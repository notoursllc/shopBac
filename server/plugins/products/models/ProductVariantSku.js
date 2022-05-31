const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.product_variant_skus,

        // One-to-One relation with ProductVariant
        // product_variant_id is the foreign key in this model
        product_variant: function() {
            return this.belongsTo('ProductVariant', 'product_variant_id');
        },

        virtuals: {
            display_price: function() {
                const sale_price = this.get('sale_price');

                if(this.get('is_on_sale') && sale_price !== null) {
                    return sale_price;
                }

                return this.get('base_price');
            },
        },

        hidden: [
            'tenant_id',
            'deleted_at'
        ]
    });
};
