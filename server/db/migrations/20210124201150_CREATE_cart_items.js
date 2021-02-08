const { DB_TABLES } = require('../../plugins/core/services/CoreService');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.cart_items,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.integer('qty').nullable();

            // Foreign Keys:
            t.uuid('cart_id')
                .notNullable()
                .references('id')
                .inTable(DB_TABLES.carts);

            t.uuid('product_id')
                .notNullable()
                .references('id')
                .inTable(DB_TABLES.products);

            t.uuid('product_variant_id')
                .notNullable()
                .references('id')
                .inTable(DB_TABLES.product_variants);

            t.uuid('sku_id')
                .notNullable()
                .references('id')
                .inTable(DB_TABLES.product_variant_skus);

            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();
            t.timestamp('deleted_at', true).nullable();

            t.index([
                'id',
                'cart_id',
                'sku_id'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(DB_TABLES.cart_items);
};
