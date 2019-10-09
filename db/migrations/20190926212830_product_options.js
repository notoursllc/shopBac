const CoreService = require('../../server/plugins/core/core.service');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.product_options,
        (t) => {
            t.uuid('id').primary();
			t.string('type').notNullable();   // ex: PRODUCT_OPTION_TYPE_SIZE
            t.string('name').notNullable();  // XL
            t.integer('ordinal').nullable();
            t.string('sku').nullable();
            t.boolean('published').defaultTo(true);
            t.integer('inventory_alert_threshold').nullable();
            t.boolean('inventory_alert_show').notNullable();
            t.integer('inventory_count').defaultTo(0);
            t.decimal('weight_oz').defaultTo(0);
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();

            t.index([
                'id'
            ]);

            // Foreign Keys:
            t.uuid('product_variation_id')
                .notNullable()
                .references('id')
                .inTable(CoreService.DB_TABLES.product_variations)
                .onDelete('CASCADE');
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.product_options);
};
