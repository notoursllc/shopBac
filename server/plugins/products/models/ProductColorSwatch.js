const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.product_color_swatches,

        uuid: true,

        hasTimestamps: true,

        format(attributes) {
            if (attributes.metadata) {
                attributes.metadata = JSON.stringify(attributes.metadata)
            }

            return attributes;
        },

        visible: [
            'id',
            // tenant_id
            'hex',
            'label',
            'description',
            'metadata',
            'created_at',
            'updated_at'
        ]
    });
};
