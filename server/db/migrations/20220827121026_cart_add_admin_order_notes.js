const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.carts, (t) => {
        t.jsonb('admin_order_notes').nullable().after('sales_tax');
    });
};

exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.carts, (t) => {
        t.dropColumn('admin_order_notes');
    });
};
