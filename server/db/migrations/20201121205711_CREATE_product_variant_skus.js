const CoreService = require('../../plugins/core/core.service');

module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.product_variant_skus,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.boolean('published').defaultTo(true);
            t.integer('ordinal').nullable().defaultTo(1);
            t.string('label').nullable();
            t.string('sku').nullable();
            t.string('barcode').nullable();

            // PRICING
            t.integer('base_price').defaultTo(0);
            t.boolean('base_price_inherit').defaultTo(false);

            t.integer('compare_at_price').defaultTo(0);
            t.boolean('compare_at_price_inherit').defaultTo(false);

            t.integer('cost_price').defaultTo(0);
            t.boolean('cost_price_inherit').defaultTo(0);

            t.integer('sale_price').defaultTo(0);
            t.boolean('sale_price_inherit').defaultTo(0);

            t.boolean('is_on_sale').defaultTo(false);
            t.boolean('is_on_sale_inherit').defaultTo(0);

            // SHIPPING
            t.decimal('weight_oz').defaultTo(0);
            t.boolean('weight_oz_inherit').defaultTo(false);

            t.string('customs_country_of_origin').nullable();
            t.boolean('customs_country_of_origin_inherit').defaultTo(false);

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
                .inTable(CoreService.DB_TABLES.product_variants);

            t.index([
                'id',
                'tenant_id',
                'product_variant_id'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.product_variant_skus);
};
