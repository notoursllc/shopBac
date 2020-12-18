const { DB_TABLES } = require('../../plugins/core/services/CoreService');

module.exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.products, function(t) {
        t.integer('shipping_package_type').nullable();
    })
};

module.exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.products, function(t) {
        t.dropColumn('shipping_package_type');
    })
};
