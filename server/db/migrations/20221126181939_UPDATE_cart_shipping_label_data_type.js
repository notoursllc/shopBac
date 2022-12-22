const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.carts, (t) => {
        t.jsonb('shipping_label').nullable();
        t.dropColumn('shipping_label_id');
    });
};

exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.carts, (t) => {
        t.dropColumn('shipping_label');
        t.string('shipping_label_id').nullable();
    })
};
