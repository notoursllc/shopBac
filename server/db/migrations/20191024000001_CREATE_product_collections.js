const CoreService = require('../../plugins/core/core.service');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.product_collections,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.boolean('published').defaultTo(false);
            t.string('name').nullable();
            t.integer('value').nullable(); // bit
            t.string('description').nullable();
            t.string('image_url').nullable();

            // SEO
            t.string('seo_page_title').nullable();
            t.text('seo_page_desc').nullable();
            t.string('seo_uri').nullable();

            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();

            t.index([
                'id',
                'tenant_id'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.product_collections);
};
