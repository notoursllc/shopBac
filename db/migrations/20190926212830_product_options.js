const CoreService = require('../../server/plugins/core/core.service');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.product_options,
        (t) => {
            t.uuid('id').primary();
			t.string('type').notNullable();   // ex: PRODUCT_OPTION_TYPE_SIZE
            t.string('name').notNullable();  // XL
            t.integer('ordinal').nullable();
            t.string('sku').nullable();

            t.index([
                'id'
            ]);

            // Foreign Keys:
            t.uuid('product_variant_id') //TODO- is this the right name of the key?
                .notNullable()
                .references('id')
                .inTable(CoreService.DB_TABLES.product_variations);
        }
    );
};


module.exports.down = (knex) => {
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.product_options);
};
