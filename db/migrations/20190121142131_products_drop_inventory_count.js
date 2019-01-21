const CoreService = require('../../server/plugins/core/core.service');

module.exports.up = (knex) => {
    return knex.schema.table(CoreService.DB_TABLES.products, (t) => {
        t.dropColumn('inventory_count');
    });
};

module.exports.down = (knex) => {
    return knex.schema.table(CoreService.DB_TABLES.products, function(t) {
        t.integer('inventory_count').defaultTo(0);
    })
};
