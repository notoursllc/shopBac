const { DB_TABLES } = require('../../plugins/core/services/CoreService');


module.exports.up = function(knex) {
    return knex.schema.dropTableIfExists('product_sizes');
};

module.exports.down = function(knex) {
    return knex.schema.createTable(
        'product_sizes',
        (t) => {
            t.uuid('id').primary();
            t.string('size').nullable();
            t.decimal('cost').nullable();
            t.decimal('base_price').nullable();
            t.decimal('sale_price').nullable();
            t.boolean('is_on_sale').defaultTo(false);
            t.integer('inventory_count').defaultTo(0);
            t.integer('sort').defaultTo(0);
            t.boolean('is_visible').defaultTo(false);
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();

            // Foreign Keys:
            t.uuid('product_id')
                .notNullable()
                .references('id')
                .inTable(DB_TABLES.products)
                .onDelete('CASCADE');

            t.index([
                'id',
                'product_id'
            ]);
        }
    );
};
