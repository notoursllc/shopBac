const { DB_TABLES } = require('../../plugins/core/services/CoreService');

module.exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.products, function(t) {
        t.dropColumn('shipping_package_type');
        t.uuid('shipping_package_type_id').nullable();
    })
};

module.exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.products, function(t) {
        t.integer('shipping_package_type').nullable();
        t.dropColumn('shipping_package_type_id');
    })
};

