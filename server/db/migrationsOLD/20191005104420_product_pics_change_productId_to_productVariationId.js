const { DB_TABLES } = require('../../plugins/core/services/CoreService');


module.exports.up = (knex) => {
    return knex.schema.table(DB_TABLES.product_pics, (t) => {
        t.dropColumn('product_id');

        // Replace the 'product_id' foreign key with the new
        // product_variation_id foreign key:
        t.uuid('product_variation_id')
            .notNullable()
            .references('id')
            .inTable(DB_TABLES.product_variations)
            .onDelete('CASCADE');

        // Replace 'product_id' from the index with 'product_variation_id'
        t.index([
            'id',
            'product_variation_id'
        ]);

    });
};



module.exports.down = (knex) => {
    return knex.schema.table(DB_TABLES.product_pics, function(t) {
        // Foreign Keys:
        t.uuid('product_id')
            .notNullable()
            .references('id')
            .inTable(DB_TABLES.products)
            .onDelete('CASCADE');

        t.index([
            'id',
            'product_id'
        ]);
    })
};
