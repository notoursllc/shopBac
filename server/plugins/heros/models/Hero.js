const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.heros,

        uuid: true,

        hasTimestamps: true,

        softDelete: true,

        format(attributes) {
            if (attributes.metadata) {
                attributes.metadata = JSON.stringify(attributes.metadata)
            }

            return attributes;
        },

        hidden: [
            'tenant_id',
            'deleted_at'
        ]
    });
};
