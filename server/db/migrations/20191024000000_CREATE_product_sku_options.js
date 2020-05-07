const CoreService = require('../../plugins/core/core.service');


module.exports.up = (knex) => {
    return knex.schema.createTable(
        CoreService.DB_TABLES.product_sku_options,
        (t) => {
            t.uuid('id').primary();
            t.string('tenant_id').nullable();
            t.string('label').nullable();
            t.string('description').nullable();
            t.json('optionData').nullable();
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
    return knex.schema.dropTableIfExists(CoreService.DB_TABLES.product_sku_options);
};
