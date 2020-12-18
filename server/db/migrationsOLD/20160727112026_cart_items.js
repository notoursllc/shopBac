const { DB_TABLES } = require('../../plugins/core/services/CoreService');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.cart_items,
        (t) => {
            t.uuid('id').primary();
            t.integer('qty').nullable();
            t.jsonb('variants').nullable();

            // Foreign Keys:
            t.uuid('cart_id')
                .notNullable()
                .references('id')
                .inTable(DB_TABLES.carts)
                .onDelete('CASCADE');

            t.uuid('product_id')
                .notNullable()
                .references('id')
                .inTable(DB_TABLES.products)
                .onDelete('CASCADE');

            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();

            t.index([
                'id',
                'cart_id',
                'product_id'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(DB_TABLES.cart_items);
};
