const CoreService = require('../../server/plugins/core/core.service');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.products,
        (t) => {
            t.uuid('id').primary();
            t.uuid('vendor').primary();
            t.boolean('published').defaultTo(false);

            // TYPES
            t.integer('gender').nullable();
            t.integer('type').nullable();
            t.integer('sub_type').nullable();
            t.integer('sales_channel_type').nullable();

            // GENERAL
            t.string('title').nullable();
            t.text('description').nullable();
            t.string('video_url').nullable();

            // SEO
            t.text('seo_page_title').nullable();
            t.text('seo_page_desc').nullable();
            t.string('seo_uri').nullable();

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

            // SHIPPING
            t.decimal('weight_oz').defaultTo(0);
            t.string('customs_country_of_origin').nullable();
            t.string('customs_harmonized_system_code').nullable();

            // TIMESTAMPS
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();

            t.index([
                'id',
                'type',
                'sub_type'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.products);
};
