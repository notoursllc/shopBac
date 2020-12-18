const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex, Promise) {
    return knex.schema.table(DB_TABLES.product_artists, function(t) {
        t.string('name').nullable();
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table(DB_TABLES.product_artists, function(t) {
        t.dropColumn('name');
    })
};
