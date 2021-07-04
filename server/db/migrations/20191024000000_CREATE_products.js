const { DB_TABLES } = require('../../plugins/core/services/CoreService');

module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.products,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.boolean('published').defaultTo(false);
            t.string('title').nullable();
            t.string('caption').nullable();
            t.text('description').nullable();

            t.jsonb('metadata').nullable();
            t.boolean('is_good').defaultTo(false); // good / service

            // TYPES
            t.integer('type').nullable();
            t.integer('sub_type').nullable();
            t.integer('sales_channel_type').nullable();
            t.integer('package_type').nullable();
            t.integer('vendor_type').nullable();
            t.integer('collections').nullable();
            t.integer('gender_type').nullable();
            t.integer('fit_type').nullable();
            t.integer('sleeve_length_type').nullable();
            t.integer('feature_type').nullable();

            // SEO
            t.text('seo_page_title').nullable();
            t.text('seo_page_desc').nullable();
            t.string('seo_uri').nullable();

            // MEDIA
            t.string('video_url').nullable();

            // SHIPPING
            t.boolean('shippable').defaultTo(true);
            t.string('customs_country_of_origin').nullable();
            t.string('customs_harmonized_system_code').nullable();

            // PACKAGING
            t.boolean('ship_alone').defaultTo(false);
            t.integer('packing_length').nullable();
            t.integer('packing_width').nullable();
            t.integer('packing_height').nullable();

            // TIMESTAMPS
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();
            t.timestamp('deleted_at', true).nullable();

            t.index([
                'id',
                'tenant_id',
                'type',
                'sub_type'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(DB_TABLES.products);
};
