const { DB_TABLES } = require('../../plugins/core/services/CoreService');

module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.product_artists,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.boolean('published').defaultTo(true);
            t.boolean('is_global').defaultTo(true);
            t.string('name').notNullable();
            t.text('description').nullable();
            t.string('website').notNullable();
            t.string('city').nullable();
            t.string('state').nullable();
            t.string('countryCodeAlpha2', 2).nullable();
            t.string('image').nullable();
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();
            t.timestamp('deleted_at', true).nullable();

            t.index([
                'id',
                'tenant_id'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(DB_TABLES.product_artists);
};
