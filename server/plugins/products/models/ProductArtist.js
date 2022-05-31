const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.product_artists,

        // http://bookshelfjs.org/#Model-instance-hasMany
        products: function() {
            return this.hasMany('Product', 'product_artist_id');
        },

        hidden: [
            'tenant_id',
            'deleted_at'
        ]
    });
};
