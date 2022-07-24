const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.tenants,

        softDelete: false,

        format(attributes) {
            if (attributes.shipengine_carriers) {
                attributes.shipengine_carriers = JSON.stringify(attributes.shipengine_carriers);
            }

            if (attributes.supported_exchange_rates) {
                attributes.supported_exchange_rates = JSON.stringify(attributes.supported_exchange_rates);
            }

            return attributes;
        },

        hidden: []
    });
};
