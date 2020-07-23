const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: CoreService.DB_TABLES.product_spec_tables,

        uuid: true,

        hasTimestamps: true,

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
