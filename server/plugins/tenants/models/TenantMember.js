const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.tenant_members,

        uuid: true,

        hasTimestamps: true,

        hidden: [
            'password'
        ]
    });
};
