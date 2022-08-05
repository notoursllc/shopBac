const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.carts, (t) => {
        t.float('currency_exchange_rate').nullable().after('currency');
    });
};

exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.carts, (t) => {
        t.dropColumn('currency_exchange_rate');
    });
};
