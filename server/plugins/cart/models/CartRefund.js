const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: DB_TABLES.cart_refunds,

            uuid: true,

            hasTimestamps: true,

            softDelete: true,

            // One-to-One relation with Cart
            // cart_id is the foreign key in this model
            cart: function() {
                return this.belongsTo('Cart', 'cart_id');
            },

            virtuals: {
                refund_total: function() {
                    let total = 0;
                    total += parseInt(this.get('subtotal_refund') || 0, 10);
                    total += parseInt(this.get('shipping_refund') || 0, 10);
                    total += parseInt(this.get('tax_refund') || 0, 10);
                    return total;
                }
            },

            hidden: [
                'tenant_id',
                'deleted_at'
            ]
        }
    );

};
