const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex, Promise) {
    return knex.schema.table(DB_TABLES.products, function(t) {
        t.uuid('tax_id').nullable();
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table(DB_TABLES.products, function(t) {
        t.dropColumn('tax_id');
    })
};
