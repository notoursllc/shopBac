const CoreService = require('../../plugins/core/core.service');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.master_types,
        (t) => {
            t.uuid('id').primary();
            t.string('tenant_id').nullable();
            t.boolean('published').defaultTo(true);
            t.string('object').nullable();
            t.string('name').notNullable();
            t.integer('value').nullable();
            t.string('slug').notNullable();
            t.string('description').nullable();
            t.json('metadata').nullable();
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
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.master_types);
};
