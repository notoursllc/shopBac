const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.tenants,

        softDelete: false,

        format(attributes) {
            if (attributes.shipengine_carriers) {
                attributes.shipengine_carriers = JSON.stringify(attributes.shipengine_carriers);
            }

            if (attributes.supported_currencies) {
                attributes.supported_currencies = JSON.stringify(attributes.supported_currencies);
            }

            return attributes;
        },

        hidden: []
    });
};
