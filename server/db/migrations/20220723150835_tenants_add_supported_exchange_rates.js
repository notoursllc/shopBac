const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.tenants, (t) => {
        t.json('supported_exchange_rates').nullable();
        t.string('default_exchange_rate').nullable();
    });
};

exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.tenants, (t) => {
        t.dropColumn('supported_exchange_rates');
        t.dropColumn('default_exchange_rate');
    });
};
