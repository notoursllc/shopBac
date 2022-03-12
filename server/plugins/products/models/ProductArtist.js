const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.product_artists,

        uuid: true,

        hasTimestamps: true,

        softDelete: true,

        // http://bookshelfjs.org/#Model-instance-hasMany
        product_variants: function() {
            return this.hasMany('ProductVariant', 'product_artist_id');
        },

        hidden: [
            'tenant_id',
            'deleted_at'
        ]
    });
};
