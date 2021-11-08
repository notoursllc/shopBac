const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.createTable(
        DB_TABLES.cart_refunds,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();
            t.integer('subtotal_refund').nullable().defaultTo(null);
            t.integer('shipping_refund').nullable().defaultTo(null);
            t.integer('tax_refund').nullable().defaultTo(null);

            t.text('description').nullable();
            t.string('reason').nullable(); // duplicate, fraudulent, requested_by_customer
            t.string('stripe_refund_id').nullable();
            t.string('paypal_refund_id').nullable();

            // Foreign Keys:
            t.uuid('cart_id')
                .notNullable()
                .references('id')
                .inTable(DB_TABLES.carts);

            // TIMESTAMPS
            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();
            t.timestamp('deleted_at', true).nullable();

            t.index([
                'id',
                'tenant_id',
                'cart_id'
            ]);
        }
    );
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists(DB_TABLES.cart_refunds);
};
