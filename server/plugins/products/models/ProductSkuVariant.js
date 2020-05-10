const CoreService = require('../../core/core.service');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: CoreService.DB_TABLES.product_sku_variant_types,

        uuid: true,

        hasTimestamps: true,

        format(attributes) {
            if (attributes.optionData) {
                attributes.optionData = JSON.stringify(attributes.optionData);
            }

            return attributes;
        },

        // tenant_id is not visible
        visible: [
            'id',
            'label',
            'description',
            'optionData',
            'created_at',
            'updated_at'
        ]
    });
};
