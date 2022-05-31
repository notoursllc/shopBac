const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend(
        {
            tableName: DB_TABLES.cart_refunds,

            // One-to-One relation with Cart
            // cart_id is the foreign key in this model
            cart: function() {
                return this.belongsTo('Cart', 'cart_id');
            },

            hidden: [
                'tenant_id',
                'deleted_at'
            ]
        }
    );

};
