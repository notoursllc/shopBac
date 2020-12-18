const { DB_TABLES } = require('../../plugins/core/services/CoreService');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.product_types,
        (t) => {
            t.uuid('id').primary();
            t.string('name').notNullable();
            t.integer('value').nullable();
            t.string('slug').notNullable();
            t.boolean('is_available').defaultTo(true);
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();

            t.index([
                'value'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(DB_TABLES.product_types);
};
