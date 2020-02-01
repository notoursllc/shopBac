const CoreService = require('../../plugins/core/core.service');

exports.up = function(knex, Promise) {
    return knex.schema.table(CoreService.DB_TABLES.products, function(t) {
        t.renameColumn('gender', 'fit')
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table(CoreService.DB_TABLES.products, function(t) {
        t.renameColumn('fit', 'gender')
    })
};
