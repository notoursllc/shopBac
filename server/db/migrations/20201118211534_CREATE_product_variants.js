const { DB_TABLES } = require('../../plugins/core/services/CoreService');

module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.product_variants,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.boolean('published').defaultTo(true);
            t.integer('ordinal').nullable().defaultTo(1);
            t.string('label').nullable();
            t.integer('basic_color_type').nullable();

            // PRICING
            t.string('currency').defaultTo('usd');
            t.integer('base_price').defaultTo(0);
            t.integer('cost_price').defaultTo(0);
            t.integer('compare_at_price').defaultTo(0);
            t.integer('sale_price').defaultTo(0);
            t.boolean('is_on_sale').defaultTo(false);
            t.boolean('is_taxable').defaultTo(true);
            t.string('tax_code').nullable();

            // ACCENT MESSAGE
            t.string('accent_message_id').nullable();
            t.timestamp('accent_message_begin', true).nullable();
            t.timestamp('accent_message_end', true).nullable();

            //  MEDIA
            t.jsonb('images').nullable();
            t.jsonb('swatches').nullable();

            // SHIPPING
            t.decimal('weight_oz').nullable().defaultTo(null);
            t.string('customs_country_of_origin').nullable();

            // TIMESTAMPS
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();
            t.timestamp('deleted_at', true).nullable();

            // Foreign Keys:
            t.uuid('product_id')
                .notNullable()
                .references('id')
                .inTable(DB_TABLES.products);
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
    return knex.schema.dropTableIfExists(DB_TABLES.product_variants);
};
