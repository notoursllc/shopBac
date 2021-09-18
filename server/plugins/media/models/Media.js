const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.media,

        uuid: true,

        hasTimestamps: true,

        softDelete: true,

        hidden: [
            'tenant_id',
            'deleted_at'
        ]
    });
};
