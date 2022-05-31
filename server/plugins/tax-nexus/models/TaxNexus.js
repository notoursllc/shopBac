const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.tax_nexus,

        softDelete: false,

        hidden: [
            'tenant_id'
        ]
    });
};
