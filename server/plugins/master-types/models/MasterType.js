const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.master_types,

        uuid: true,

        hasTimestamps: true,

        format(attributes) {
            if (attributes.metadata) {
                attributes.metadata = JSON.stringify(attributes.metadata);
            }

            return attributes;
        },

        // tenant_id is not visible
        visible: [
            'id',
            'published',
            'object',
            'name',
            'value',
            'slug',
            'description',
            'metadata',
            'ordinal',
            'created_at',
            'updated_at'
        ]
    });
};
