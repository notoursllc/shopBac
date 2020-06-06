const CoreService = require('../../plugins/core/core.service');

module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.product_sku_images,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.boolean('published').defaultTo(true);
            t.string('image_url').nullable();
            t.string('alt_text').nullable();
            t.integer('width').defaultTo(0);
            t.jsonb('variants').nullable();
            t.integer('ordinal').nullable().defaultTo(1);

            // TIMESTAMPS
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();
            t.timestamp('deleted_at', true).nullable();

            // Foreign Keys:
            t.uuid('product_sku_id')
                .notNullable()
                .references('id')
                .inTable(CoreService.DB_TABLES.product_skus)
                .onDelete('CASCADE');

            t.index([
                'id',
                'tenant_id',
                'product_sku_id'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.product_sku_images);
};
