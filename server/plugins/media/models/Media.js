const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: CoreService.DB_TABLES.media,

        uuid: true,

        hasTimestamps: true,

        softDelete: true,

        format(attributes) {
            if (attributes.variants) {
                attributes.variants = JSON.stringify(attributes.variants);
            }

            return attributes;
        },

        // tenant_id is not visible
        visible: [
            'id',
            'resource_type',
            'url',
            'width',
            'variants',
            'created_at',
            'updated_at'
        ]
    });
};
