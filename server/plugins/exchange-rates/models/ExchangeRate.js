const { DB_TABLES } = require('../../core/services/CoreService');

module.exports = function (baseModel, bookshelf) {
    return baseModel.extend({
        tableName: DB_TABLES.exchange_rates,

        uuid: false,

        softDelete: false,

        format(attributes) {
            if (attributes.rates) {
                attributes.rates = JSON.stringify(attributes.rates)
            }

            return attributes;
        },

        hidden: [
            'updated_at'
        ]
    });
};
