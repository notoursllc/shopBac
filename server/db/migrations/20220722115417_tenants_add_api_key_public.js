const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.tenants, (t) => {
        t.string('api_key_public').nullable();
    })
};

exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.tenants, (t) => {
        t.dropColumn('api_key_public');
    })
};
