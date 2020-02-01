const CoreService = require('../../plugins/core/core.service');

module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.products,
        (t) => {
            t.uuid('id').primary();
            t.string('tenant_id').nullable();
            t.boolean('published').defaultTo(false);
            t.string('title').nullable();
            t.string('caption').nullable();
            t.text('description').nullable();
            t.boolean('shippable').defaultTo(true);
            t.jsonb('attributes').nullable()
            t.jsonb('metadata').nullable();
            t.boolean('is_good').defaultTo(false); // good / service

            // TYPES
            t.integer('type').nullable();
            t.integer('sub_type').nullable();
            t.integer('fit_type').nullable();
            t.integer('sales_channel_type').nullable();
            t.integer('package_type').nullable();
            t.integer('vendor_type').nullable();
            t.integer('collections').nullable();

            // SEO
            t.text('seo_page_title').nullable();
            t.text('seo_page_desc').nullable();
            t.string('seo_uri').nullable();

            // MEDIA
            t.string('video_url').nullable();

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
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.products);
};
