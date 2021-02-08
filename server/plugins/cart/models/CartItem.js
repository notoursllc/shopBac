const { DB_TABLES } = require('../../core/services/CoreService');
const accounting = require('accounting');


module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: DB_TABLES.cart_items,

            uuid: true,

            hasTimestamps: true,

            softDelete: true,

            // One-to-One relation with Cart
            // cart_id is the foreign key in this model
            cart: function() {
                return this.belongsTo('Cart', 'cart_id');
            },

            product: function() {
                return this.belongsTo('Product', 'product_id');
            },

            product_variant: function() {
                return this.belongsTo('ProductVariant', 'product_variant_id');
            },

            sku: function() {
                return this.belongsTo('ProductVariantSku', 'sku_id');
            },

            // virtuals: {
            //     total_item_price: function() {
            //         let val = this.get('qty') * this.related('sku').get('display_price');
            //         return accounting.toFixed(val, 2);
            //     }
            // },

            visible: [
                'id',
                // 'tenant_id',
                'qty',

                'created_at',
                'updated_at',
                // 'deleted_at'

                // relations
                'cart',
                'product',
                'product_variant',
                'sku'
            ]
        },
        {
            masks: {
                shopping_cart: 'id,product'
            }

            /**
             * A simple helper function to find by json property in the 'variant' column
             * Only searches the top level attributes of the variant json, so you'll need
             * to write your own code to search by any nested attributes.
             *
             * This is helpful:
             * https://gist.github.com/gerzhan/61a9d228caeb458d17e380aed8910531
             *
             * @param request
             * @returns {Promise}
             */
            // findByVariant: function(cart_id, product_id, variantName, variantValue) {
            //     return this.query((qb) => {
            //         qb.where('cart_id', '=', cart_id);
            //         qb.andWhere('product_id', '=', product_id);
            //         qb.andWhere('variants', '@>', `{"${variantName}": "${variantValue}"}`);  //https://stackoverflow.com/questions/27780117/bookshelf-js-where-with-json-column-postgresql#36876753
            //     }).fetch();
            // }
        });

};
