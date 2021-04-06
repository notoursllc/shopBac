const { DB_TABLES } = require('../../plugins/core/services/CoreService');

module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.product_variant_skus,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.boolean('published').defaultTo(true);
            t.integer('ordinal').nullable().defaultTo(1);
            t.string('label').nullable();
            t.string('sku').nullable();
            t.string('barcode').nullable();

            // PRICING
            t.integer('base_price').nullable().defaultTo(null);
            t.integer('compare_at_price').nullable().defaultTo(null);
            t.integer('cost_price').nullable().defaultTo(null);
            t.integer('sale_price').nullable().defaultTo(null);
            t.boolean('is_on_sale').defaultTo(false);

            // SHIPPING
            t.decimal('weight_oz').nullable().defaultTo(null);
            t.string('customs_country_of_origin').nullable().defaultTo(null);

            // INVENTORY
            t.integer('inventory_count').defaultTo(0);
            t.boolean('track_inventory_count').defaultTo(true);
            t.boolean('visible_if_no_inventory').defaultTo(true);

            // TIMESTAMPS
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();
            t.timestamp('deleted_at', true).nullable();

            // Foreign Keys:
            t.uuid('product_variant_id')
                .notNullable()
                .references('id')
                .inTable(DB_TABLES.product_variants);

            t.index([
                'id',
                'tenant_id',
                'product_variant_id'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(DB_TABLES.product_variant_skus);
};
