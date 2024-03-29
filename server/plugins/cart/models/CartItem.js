const { DB_TABLES } = require('../../core/services/CoreService');
const accounting = require('accounting');


module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: DB_TABLES.cart_items,

            // One-to-One relation with Cart
            // cart_id is the foreign key in this model
            cart: function() {
                return this.belongsTo('Cart', 'cart_id');
            },

            virtuals: {
                item_price_total: function() {
                    const qty = this.get('qty');
                    let total = null;

                    if(qty) {
                        const product_variant_sku_price = this.get('product_variant_sku')?.display_price;

                        // The SKU price gets prescident if it exists
                        if (product_variant_sku_price !== null) {
                            total = product_variant_sku_price * qty;
                        }

                        // if(total !== null) {
                        //     total = accounting.toFixed(total, 2);
                        // }
                    }

                    return total;
                },

                item_weight_total: function() {
                    const qty = this.get('qty');
                    let total = null;

                    if(qty) {
                        const product_variant_sku_weight = this.get('product_variant_sku')?.weight_oz;

                        if (product_variant_sku_weight !== null) {
                            total = product_variant_sku_weight * qty;
                        }
                    }

                    return total;
                }
            },

            hidden: [
                'tenant_id',
                'deleted_at'
            ]
        },

        {
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
        }
    );

};
