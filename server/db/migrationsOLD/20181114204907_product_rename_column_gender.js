const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex, Promise) {
    return knex.schema.table(DB_TABLES.products, function(t) {
        t.renameColumn('gender', 'fit')
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table(DB_TABLES.products, function(t) {
        t.renameColumn('fit', 'gender')
    })
};
