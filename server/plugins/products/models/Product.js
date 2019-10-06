const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: CoreService.DB_TABLES.products,

            uuid: true,

            hasTimestamps: true,

            artist: function() {
                // product_artist_id is the foreign key in this model
                return this.belongsTo('ProductArtist', 'product_artist_id');
            },

            sizes: function() {
                // product_id is the foreign key in ProductSize
                return this.hasMany('ProductSize', 'product_id');
            },

            variations: function() {
                // product_pic_id is the foreign key in ProductPicVariant
                return this.hasMany('ProductVariation', 'product_id');
            },

            cart_items: function() {
                // product_id is the foreign key in ShoppingCartItem
                return this.hasMany('ShoppingCartItem', 'product_id');
            },

            virtuals: {
                total_inventory_count: function() {
                    let totalCount = 0;

                    this.related('sizes').forEach((sizeModel) => {
                        totalCount += parseInt(sizeModel.get('inventory_count') || 0, 10);
                    });

                    return totalCount;
                },

                display_price: function() {
                    let price = 0;
                    let salePrice = this.get('sale_price') || 0;
                    let basePrice = this.get('base_price') || 0;

                    if(this.get('is_on_sale') && salePrice) {
                        price = salePrice;
                    }
                    else if(basePrice) {
                        price = basePrice;
                    }

                    return price;
                }
            }
        }
    );
};
