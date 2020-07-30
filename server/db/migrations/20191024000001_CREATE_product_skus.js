const CoreService = require('../../plugins/core/core.service');

module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.product_skus,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.boolean('published').defaultTo(true);
            t.jsonb('attributes').nullable();
            t.jsonb('metadata').nullable();
            t.integer('ordinal').nullable().defaultTo(1);
            t.jsonb('data_table').nullable();

            // PRICING
            t.string('currency').defaultTo('usd');
            t.integer('base_price').defaultTo(0);
            t.integer('cost_price').defaultTo(0);
            t.integer('compare_at_price').defaultTo(0);
            t.integer('sale_price').defaultTo(0);
            t.boolean('is_on_sale').defaultTo(false);
            t.boolean('is_taxable').defaultTo(true);
            t.string('tax_code').nullable();

            // INVENTORY
            t.integer('inventory_count').defaultTo(0);
            t.string('sku').nullable();
            t.string('barcode').nullable();
            t.boolean('visible_if_out_of_stock').defaultTo(true);
            t.boolean('track_quantity').defaultTo(true);

            // SHIPPING
            t.decimal('weight_oz').defaultTo(0);
            t.string('customs_country_of_origin').nullable();
            t.string('customs_harmonized_system_code').nullable();

            // TIMESTAMPS
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();
            t.timestamp('deleted_at', true).nullable();

            // Foreign Keys:
            t.uuid('product_id')
                .notNullable()
                .references('id')
                .inTable(CoreService.DB_TABLES.products);
            // .onDelete('CASCADE');

            t.index([
                'id',
                'tenant_id',
                'product_id'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.product_skus);
};
