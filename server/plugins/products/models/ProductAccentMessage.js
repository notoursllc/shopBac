const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.product_accent_messages,

        uuid: true,

        hasTimestamps: true,

        // tenant_id is not visible
        visible: [
            'id',
            'message',
            'created_at',
            'updated_at'
        ]
    });
};
