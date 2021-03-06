const { DB_TABLES } = require('../../plugins/core/services/CoreService');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.product_pics,
        (t) => {
            t.uuid('id').primary();
            t.string('url').nullable();
            t.integer('sort_order');
            t.integer('width');
            t.integer('height');
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



module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(DB_TABLES.product_pics);
};
