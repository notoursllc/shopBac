const { DB_TABLES } = require('../../plugins/core/services/CoreService');

module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.tenant_members,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.string('email').nullable();
            t.string('password').nullable();
            t.boolean('active').defaultTo(true);
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
    return knex.schema.dropTableIfExists(DB_TABLES.users);
};
