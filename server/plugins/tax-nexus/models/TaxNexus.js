const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.tax_nexus,

        uuid: true,

        hasTimestamps: true,

        hidden: [
            'tenant_id'
        ]
    });
};
