const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.createTable(
        DB_TABLES.heros,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.boolean('published').defaultTo(true);
            t.string('title').nullable();
            t.text('caption').nullable();
            t.integer('ordinal').nullable().defaultTo(1);
            t.string('url').nullable();
            t.string('alt_text').nullable();
            t.jsonb('metadata').nullable();

            // TIMESTAMPS
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

exports.down = function(knex) {
    return knex.schema.dropTableIfExists(DB_TABLES.heros);
};
