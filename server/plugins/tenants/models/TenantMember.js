const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: CoreService.DB_TABLES.tenant_members,

        uuid: true,

        hasTimestamps: true,

        visible: [
            'id',
            'tenant_id',
            'email',
            'active',
            'created_at',
            'updated_at'
        ]
    });
};
