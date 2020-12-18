const { DB_TABLES } = require('../../plugins/core/services/CoreService');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.product_variations,
        (t) => {
            t.uuid('id').primary();
            t.string('name').notNullable();
            t.text('description').nullable();
            t.integer('ordinal').nullable();
            t.string('sku').nullable();
            t.boolean('published').defaultTo(true);
            t.integer('inventory_alert_threshold').nullable();
            t.boolean('inventory_alert_show').notNullable();
            t.integer('inventory_count').defaultTo(0);
            t.boolean('hide_if_out_of_stock').defaultTo(true);
            t.decimal('weight_oz').defaultTo(0);
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();

            t.index([
                'id'
            ]);

            // Foreign Keys:
            t.uuid('product_id')
                .notNullable()
                .references('id')
                .inTable(DB_TABLES.products);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(DB_TABLES.product_types);
};
