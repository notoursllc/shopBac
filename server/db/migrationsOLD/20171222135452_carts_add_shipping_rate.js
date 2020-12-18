const { DB_TABLES } = require('../../plugins/core/services/CoreService');

module.exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.carts, function(t) {
        t.jsonb('shipping_rate').nullable();
    })
};

module.exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.carts, function(t) {
        t.dropColumn('shipping_rate');
    })
};
