const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.product_data_tables,

        softDelete: false,

        format(attributes) {
            if (attributes.table_data) {
                attributes.table_data = JSON.stringify(attributes.table_data);
            }

            return attributes;
        },

        // tenant_id is not visible
        visible: [
            'id',
            'name',
            'table_data',
            'created_at',
            'updated_at'
        ]
    });
};
