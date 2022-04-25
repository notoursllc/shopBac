const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.createTable(
        DB_TABLES.product_cross_sells,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.uuid('product_id');
            t.uuid('cross_sell_product_id');

            // TIMESTAMPS
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();

            t.index([
                'id',
                'tenant_id'
            ]);
        }
    );
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists(DB_TABLES.product_cross_sells);
};
