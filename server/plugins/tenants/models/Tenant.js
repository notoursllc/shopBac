const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.tenants,

        uuid: true,

        hasTimestamps: true,

        visible: [
            'id',
            'api_key',
            'application_name',
            'application_url',
            'active',
            'created_at',
            'updated_at'
        ]
    });
};
