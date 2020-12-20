const { DB_TABLES } = require('../../plugins/core/services/CoreService');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.master_types,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.boolean('published').defaultTo(true);
            t.string('object').nullable();
            t.string('name').notNullable();
            t.integer('value').nullable();
            t.string('slug').nullable();
            t.string('description').nullable();
            t.json('metadata').nullable();
            t.integer('ordinal').nullable().defaultTo(1);
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
    return knex.schema.dropTableIfExists(DB_TABLES.master_types);
};
