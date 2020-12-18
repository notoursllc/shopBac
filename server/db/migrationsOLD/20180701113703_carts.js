const { DB_TABLES } = require('../../plugins/core/services/CoreService');

module.exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.carts, function(t) {
        t.dropColumn('status');
    })
};

module.exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.carts, function(t) {
        t.string('status').nullable();
    })
};
