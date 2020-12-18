const { DB_TABLES } = require('../../plugins/core/services/CoreService');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.payments,
        (t) => {
            t.uuid('id').primary();
            t.string('transaction_id');
            t.jsonb('transaction').nullable();
            t.boolean('success');
            t.boolean('void');
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();

            // Foreign Keys:
            t.uuid('cart_id')
                .notNullable()
                .references('id')
                .inTable(DB_TABLES.carts)
                .onDelete('CASCADE');

            t.index([
                'id',
                'cart_id'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(DB_TABLES.payments);
};
