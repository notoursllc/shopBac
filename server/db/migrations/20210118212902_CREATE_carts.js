const { DB_TABLES } = require('../../plugins/core/services/CoreService');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        DB_TABLES.carts,
        (t) => {
            t.uuid('id').primary();
            t.uuid('tenant_id').nullable();

            t.string('billing_firstName').nullable();
            t.string('billing_lastName').nullable();
            t.string('billing_company').nullable();
            t.string('billing_streetAddress').nullable();
            t.string('billing_extendedAddress').nullable();
            t.string('billing_city').nullable();
            t.string('billing_state').nullable();
            t.string('billing_postalCode').nullable();
            t.string('billing_countryCodeAlpha2', 2).nullable();
            t.string('billing_phone').nullable();
            t.boolean('billing_same_as_shipping').defaultTo(true);

            t.string('shipping_firstName').nullable();
            t.string('shipping_lastName').nullable();
            t.string('shipping_streetAddress').nullable();
            t.string('shipping_extendedAddress').nullable();
            t.string('shipping_company').nullable();
            t.string('shipping_city').nullable();
            t.string('shipping_state').nullable();
            t.string('shipping_postalCode').nullable();
            t.string('shipping_countryCodeAlpha2', 2).nullable();
            t.string('shipping_phone').nullable();
            t.string('shipping_email').nullable();

            t.string('currency').notNullable().defaultTo('usd');
            t.jsonb('selected_shipping_rate').nullable();
            t.jsonb('shipping_rate_quote').nullable();
            t.string('shipping_label_id').nullable();
            t.jsonb('tax_nexus_applied').nullable();
            t.string('stripe_payment_intent_id').nullable();
            t.string('stripe_order_id').nullable();
            t.string('paypal_order_id').nullable();
            t.integer('sales_tax').nullable();

            t.timestamp('created_at', true).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', true).nullable();
            t.timestamp('deleted_at', true).nullable();
            t.timestamp('closed_at', true).nullable();
            t.timestamp('shipped_at', true).nullable();

            t.index([
                'id',
                'tenant_id'
            ]);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(DB_TABLES.carts);
};
