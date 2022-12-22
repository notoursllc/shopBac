const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.tenants, (t) => {
        t.string('order_details_page_url').nullable();
    });
};

exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.tenants, (t) => {
        t.dropColumn('order_details_page_url');
    })
};
