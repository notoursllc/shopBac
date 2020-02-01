const CoreService = require('../../plugins/core/core.service');

exports.up = function(knex, Promise) {
    return knex.schema.table(CoreService.DB_TABLES.products, function(t) {
        t.uuid('tax_id').nullable();
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table(CoreService.DB_TABLES.products, function(t) {
        t.dropColumn('tax_id');
    })
};
