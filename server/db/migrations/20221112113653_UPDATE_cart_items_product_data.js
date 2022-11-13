const { DB_TABLES } = require('../../plugins/core/services/CoreService');

exports.up = function(knex) {
    return knex.schema.table(DB_TABLES.cart_items, (t) => {
        t.dropColumn('product_id');
        t.dropColumn('product_variant_id');
        t.dropColumn('product_variant_sku_id');

        t.index([
            'id',
            'cart_id'
        ]);

        t.jsonb('product').nullable();
        t.jsonb('product_variant').nullable();
        t.jsonb('product_variant_sku').nullable();
    });
};

exports.down = function(knex) {
    return knex.schema.table(DB_TABLES.cart_items, (t) => {
        t.uuid('product_id')
            .notNullable()
            .references('id')
            .inTable(DB_TABLES.products);

        t.uuid('product_variant_id')
            .notNullable()
            .references('id')
            .inTable(DB_TABLES.product_variants);

        t.uuid('product_variant_sku_id')
            .notNullable()
            .references('id')
            .inTable(DB_TABLES.product_variant_skus);

        t.index([
            'id',
            'cart_id',
            'product_variant_sku_id'
        ]);

        t.dropColumn('product');
        t.dropColumn('product_variant');
        t.dropColumn('product_variant_sku');
    })
};

