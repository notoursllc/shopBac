const { DB_TABLES } = require('../../plugins/core/services/CoreService');

module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.tenants,
        (t) => {
            t.uuid('id').primary();
            t.string('api_key').nullable();
            t.string('application_name').nullable();
            t.string('application_url').nullable();
            t.text('application_logo').nullable();
            t.boolean('active').defaultTo(true);
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();

            t.index([
                'id'
            ]);
        }
    );
};

module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(DB_TABLES.tenants);
};
