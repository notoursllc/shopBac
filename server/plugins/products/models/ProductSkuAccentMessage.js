const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: CoreService.DB_TABLES.product_sku_accent_messages,

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
