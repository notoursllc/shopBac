const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.tenants, (t) => {
        t.json('supported_currencies').nullable();
        t.string('default_currency').nullable();
    });
};

exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.tenants, (t) => {
        t.dropColumn('supported_currencies');
        t.dropColumn('default_currency');
    });
};
