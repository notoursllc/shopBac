const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.createTable(
        DB_TABLES.exchange_rates,
        (t) => {
            t.integer('id', { primaryKey: true });
            t.string('base').nullable();
            t.jsonb('rates').nullable();
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();

            t.index([
                'id'
            ]);
        }
    );
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists(DB_TABLES.exchange_rates);
};
