const { DB_TABLES } = require('../../plugins/core/services/CoreService');

module.exports.up = (knex) => {
    return knex.schema.table(DB_TABLES.product_variants, (t) => {
        t.dropColumn('weight_oz');
    });
};


module.exports.down = (knex) => {
    return knex.schema.table(DB_TABLES.product_variants, (t) => {
        t.decimal('weight_oz').nullable().defaultTo(null);
    });
};
