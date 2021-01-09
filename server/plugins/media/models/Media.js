const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.media,

        uuid: true,

        hasTimestamps: true,

        softDelete: true,

        format(attributes) {
            if (attributes.variants) {
                attributes.variants = JSON.stringify(attributes.variants);
            }

            return attributes;
        },

        visible: [
            'id',
            // 'tenant_id',
            'resource_type',
            'alt_text',
            'ordinal',
            'variants',
            'created_at',
            'updated_at',
            // 'deleted_at'
        ]
    });
};
