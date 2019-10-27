const CoreService = require('../../server/plugins/core/core.service');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.product_variants,
        (t) => {
            t.uuid('id').primary();
            t.boolean('published').defaultTo(false);
            t.string('display_name').nullable();
            t.string('image').nullable();

            // PRICING
            t.decimal('base_price').defaultTo(0);
            t.decimal('sale_price').defaultTo(0);
            t.boolean('is_on_sale').defaultTo(false);
            t.decimal('cost').defaultTo(0);
            t.boolean('is_taxable').defaultTo(true);
            t.string('tax_code').nullable();

            // INVENTORY
            t.integer('inventory_count').defaultTo(0);
            t.string('sku').nullable();
            t.string('barcode').nullable();
            t.boolean('hide_if_out_of_stock').defaultTo(true);
            t.boolean('track_quantity').defaultTo(true);

            // SHIPPING
            t.decimal('weight_oz').defaultTo(0);
            t.string('customs_country_of_origin').nullable();
            t.string('customs_harmonized_system_code').nullable();

            // TIMESTAMPS
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();

            // Foreign Keys:
            t.uuid('product_id')
                .notNullable()
                .references('id')
                .inTable(CoreService.DB_TABLES.products)
                .onDelete('CASCADE');

            t.index([
                'id',
                'product_id'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.product_variants);
};
