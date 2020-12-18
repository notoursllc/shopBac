const { DB_TABLES } = require('../../plugins/core/services/CoreService');

module.exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.carts, function(t) {
        t.dropColumn('shipping_total');
    })
};

module.exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.carts, function(t) {
        t.decimal('shipping_total').nullable();
    })
};
